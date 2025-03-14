import type { Express } from "express";
import { createServer } from "http";
import multer from "multer";
import { storage } from "./storage";
import { generateQuestions, evaluateAnswers, analyzeQuestionPaperTemplate, generateTutorResponse, adjustQuestionDifficulty, analyzeStudentSkills } from "./openai";
import { insertExamSchema, insertAttemptSchema, insertQuestionTemplateSchema } from "@shared/schema";
import { createTransport } from "nodemailer";
import { randomUUID } from "crypto";
import { parseCommand, generateResponse } from "./commandParser";

// Configure multer for handling file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

export async function registerRoutes(app: Express) {
  // Template management routes
  app.get("/api/templates", async (req, res) => {
    try {
      const templates = await storage.getTemplates({});
      res.json(templates);
    } catch (error: any) {
      console.error("Error fetching templates:", error);
      res.status(500).json({
        message: "Failed to fetch templates",
        error: error.message
      });
    }
  });

  app.patch("/api/templates/:id", async (req, res) => {
    try {
      const templateId = parseInt(req.params.id);
      if (isNaN(templateId)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }

      const validation = insertQuestionTemplateSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid template data",
          errors: validation.error.errors
        });
      }

      const existingTemplate = await storage.getTemplateById(templateId);
      if (!existingTemplate) {
        return res.status(404).json({ message: "Template not found" });
      }

      const updatedTemplate = await storage.updateTemplate(templateId, validation.data);
      res.json(updatedTemplate);
    } catch (error: any) {
      console.error("Error updating template:", error);
      res.status(500).json({
        message: "Failed to update template",
        error: error.message
      });
    }
  });

  app.get("/api/templates/search", async (req, res) => {
    try {
      const { curriculum, subject, grade, institution, paperFormat } = req.query;

      console.log("Template search request with params:", {
        curriculum,
        subject,
        grade,
        institution,
        paperFormat
      });

      const templates = await storage.getTemplates({
        curriculum: curriculum as string,
        subject: subject as string,
        grade: grade as string,
        institution: institution as string,
        paperFormat: paperFormat as string
      });

      console.log("Found templates:", templates);
      res.json(templates);
    } catch (error: any) {
      console.error("Error searching templates:", error);
      res.status(500).json({
        message: "Failed to search templates",
        error: error.message
      });
    }
  });

  app.get("/api/templates/:id", async (req, res) => {
    try {
      const templateId = parseInt(req.params.id);
      if (isNaN(templateId)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }

      const template = await storage.getTemplateById(templateId);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      res.json(template);
    } catch (error: any) {
      console.error("Error fetching template:", error);
      res.status(500).json({
        message: "Failed to fetch template",
        error: error.message
      });
    }
  });

  app.post("/api/templates", async (req, res) => {
    try {
      console.log("Creating template with data:", req.body);
      const validation = insertQuestionTemplateSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid template data",
          errors: validation.error.errors
        });
      }

      const template = await storage.createTemplate(validation.data);
      res.json(template);
    } catch (error: any) {
      console.error("Error creating template:", error);
      res.status(500).json({
        message: "Failed to create template",
        error: error.message
      });
    }
  });

  // Add this endpoint for uploading and analyzing question paper images
  app.post("/api/templates/analyze-image", upload.single("questionPaper"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const imageBase64 = req.file.buffer.toString('base64');
      const template = await analyzeQuestionPaperTemplate(imageBase64);

      res.json(template);
    } catch (error: any) {
      console.error("Error analyzing template:", error);
      res.status(500).json({
        message: "Failed to analyze template",
        error: error.message
      });
    }
  });


  // Modified exam creation to handle expanded curricula and subjects
  app.post("/api/exams", async (req, res) => {
    try {
      console.log("Received exam creation request:", req.body);

      const validation = insertExamSchema.safeParse(req.body);
      if (!validation.success) {
        console.error("Validation failed:", validation.error.errors);
        return res.status(400).json({
          message: "Invalid exam data",
          errors: validation.error.errors
        });
      }

      // TODO: Add proper authentication middleware
      const userId = 1; // Temporary for testing

      // Get relevant templates for the specific curriculum and subject
      const templates = await storage.getTemplates({
        curriculum: validation.data.curriculum,
        subject: validation.data.subject,
        grade: validation.data.grade
      });

      console.log(`Found ${templates.length} relevant templates for ${validation.data.curriculum} - ${validation.data.subject}`);

      let selectedTemplate;
      if (validation.data.templateId) {
        selectedTemplate = await storage.getTemplateById(validation.data.templateId);
        if (!selectedTemplate) {
          return res.status(404).json({ message: "Selected template not found" });
        }
      }

      console.log("Generating questions with validated data:", validation.data);
      const generatedContent = await generateQuestions(
        validation.data.subject,
        validation.data.curriculum,
        validation.data.grade,
        validation.data.difficulty,
        validation.data.format,
        templates,
        selectedTemplate
      );

      if (!generatedContent.questions || !Array.isArray(generatedContent.questions)) {
        throw new Error("Invalid response from question generator");
      }

      console.log("Creating exam in storage");
      const exam = await storage.createExam({
        ...validation.data,
        userId,
        questions: generatedContent.questions
      });

      console.log("Exam created successfully:", exam);
      res.json(exam);
    } catch (error: any) {
      console.error("Error creating exam:", error);
      res.status(500).json({
        message: "Failed to create exam",
        error: error.message
      });
    }
  });

  app.get("/api/exams", async (req, res) => {
    try {
      // TODO: Add proper authentication middleware
      const userId = 1; // Temporary for testing
      const exams = await storage.getUserExams(userId);
      res.json(exams);
    } catch (error: any) {
      console.error("Error fetching exams:", error);
      res.status(500).json({
        message: "Failed to fetch exams",
        error: error.message
      });
    }
  });

  app.get("/api/exams/:id", async (req, res) => {
    try {
      const examId = parseInt(req.params.id);
      if (isNaN(examId)) {
        return res.status(400).json({ message: "Invalid exam ID" });
      }

      const exam = await storage.getExam(examId);
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }

      res.json(exam);
    } catch (error: any) {
      console.error("Error fetching exam:", error);
      res.status(500).json({
        message: "Failed to fetch exam",
        error: error.message
      });
    }
  });

  app.get("/api/attempts", async (req, res) => {
    try {
      // TODO: Add proper authentication middleware
      const userId = 1; // Temporary for testing
      const attempts = await storage.getAttempts(userId);
      res.json(attempts);
    } catch (error: any) {
      console.error("Error fetching attempts:", error);
      res.status(500).json({
        message: "Failed to fetch attempts",
        error: error.message
      });
    }
  });

  app.get("/api/achievements", async (req, res) => {
    try {
      // TODO: Add proper authentication middleware
      const userId = 1; // Temporary for testing
      const userAchievements = await storage.getUserAchievements(userId);

      // Transform the data to include progress information
      const achievementsWithProgress = userAchievements.map(ua => ({
        ...ua.achievement,
        earned: true,
        progress: 1
      }));

      // Get all achievements to include unearned ones
      const allAchievements = await storage.getAchievements();
      const unearned = allAchievements
        .filter(a => !achievementsWithProgress.some(ua => ua.id === a.id))
        .map(a => ({
          ...a,
          earned: false,
          progress: 0
        }));

      res.json([...achievementsWithProgress, ...unearned]);
    } catch (error: any) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({
        message: "Failed to fetch achievements",
        error: error.message
      });
    }
  });

  app.post("/api/attempts/upload", upload.single("answer"), async (req, res) => {
    try {
      if (!req.file && !req.body.answers) {
        return res.status(400).json({ message: "No answers provided" });
      }

      const examId = parseInt(req.body.examId);
      const userId = parseInt(req.body.userId);
      const startTime = new Date(req.body.startTime);

      if (isNaN(examId) || isNaN(userId)) {
        return res.status(400).json({ message: "Invalid exam ID or user ID" });
      }

      console.log("[Exam] Processing attempt submission:", {
        examId,
        userId,
        startTime: startTime.toISOString(),
        hasImage: !!req.file,
        hasAnswers: !!req.body.answers
      });

      const exam = await storage.getExam(examId);
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }

      let evaluation;
      const questions = exam.questions;
      const hasTheoryQuestions = questions.some(q => q.type !== 'MCQ');

      if (hasTheoryQuestions) {
        console.log("[Exam] Evaluating theory questions from image");
        if (!req.file) {
          return res.status(400).json({ message: "Answer image required for theory questions" });
        }
        evaluation = await evaluateAnswers(req.file.buffer.toString('base64'), questions);
      } else {
        console.log("[Exam] Evaluating MCQ answers");
        if (!req.body.answers) {
          return res.status(400).json({ message: "Answers required for MCQ questions" });
        }

        const selectedAnswers = JSON.parse(req.body.answers);
        const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
        let totalScore = 0;

        // Create detailed feedback for MCQ questions
        const perQuestionFeedback = questions.map((q, index) => {
          const isCorrect = selectedAnswers[index] === q.correctAnswer;
          const score = isCorrect ? q.marks : 0;
          totalScore += score;

          return {
            questionNumber: index + 1,
            score,
            conceptualUnderstanding: {
              level: isCorrect ? "Proficient" : "Needs Improvement",
              details: isCorrect 
                ? "Demonstrated clear understanding of the concept" 
                : `Selected incorrect option. The correct answer was ${q.correctAnswer}`
            },
            technicalAccuracy: {
              score: isCorrect ? 100 : 0,
              details: isCorrect 
                ? "Correct answer selected" 
                : "Incorrect answer selected"
            },
            keyConceptsCovered: q.keyConcepts || [q.topic],
            misconceptions: isCorrect ? [] : ["Review this concept's fundamentals"],
            improvementAreas: isCorrect ? [] : ["Practice similar questions to strengthen understanding"],
            exemplarAnswer: `The correct answer is ${q.correctAnswer}. ${q.rubric || ''}`
          };
        });

        const percentage = Math.round((totalScore / totalMarks) * 100);

        evaluation = {
          score: percentage,
          feedback: {
            overall: {
              summary: `You scored ${percentage}% on this MCQ exam.`,
              strengths: perQuestionFeedback
                .filter(q => q.score > 0)
                .map(q => `Strong understanding of ${q.keyConceptsCovered[0]}`),
              areas_for_improvement: perQuestionFeedback
                .filter(q => q.score === 0)
                .map(q => `Need to review ${q.keyConceptsCovered[0]}`),
              learning_recommendations: []
            },
            perQuestion: perQuestionFeedback
          }
        };
      }

      console.log("[Exam] Evaluation completed:", {
        examId,
        userId,
        score: evaluation.score,
        summary: evaluation.feedback.overall.summary,
        questionCount: evaluation.feedback.perQuestion.length
      });

      const attempt = await storage.createAttempt({
        examId,
        userId,
        startTime,
        endTime: new Date(),
        answerImageUrl: req.file ? `data:image/jpeg;base64,${req.file.buffer.toString('base64')}` : undefined,
        score: evaluation.score,
        feedback: evaluation.feedback
      });

      console.log("[Exam] Attempt saved:", {
        attemptId: attempt.id,
        score: attempt.score
      });

      // Check and award achievements
      const newAchievements = await storage.checkAndAwardAchievements(userId);

      res.json({
        attempt,
        newAchievements
      });
    } catch (error: any) {
      console.error("[Exam] Error processing attempt:", error.message);
      res.status(500).json({
        message: "Failed to process attempt",
        error: error.message
      });
    }
  });

  app.post("/api/achievements/seed", async (req, res) => {
    try {
      const defaultAchievements = [
        {
          name: "Perfect Score",
          description: "Score 100% on any exam",
          type: "EXAM_SCORE",
          requirement: { score: 100 },
          badgeIcon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="w-6 h-6"><path d="M12 15l-2 5l-4-3l-3 4l-1-6l-5-2l5-2l1-6l3 4l4-3l2 5l2-5l4 3l3-4l1 6l5 2l-5 2l-1 6l-3-4l-4 3z"/></svg>`,
          points: 100
        },
        {
          name: "Subject Master",
          description: "Achieve an average score of 90% or higher in any subject",
          type: "SUBJECT_MASTERY",
          requirement: { subjectMasteryLevel: 90 },
          badgeIcon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="w-6 h-6"><path d="M12 2L2 7l10 5l10-5l-10-5zM2 17l10 5l10-5M2 12l10 5l10-5"/></svg>`,
          points: 75
        },
        {
          name: "Template Creator",
          description: "Create your first question template",
          type: "TEMPLATE_CREATION",
          requirement: { templateCount: 1 },
          badgeIcon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="w-6 h-6"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>`,
          points: 50
        }
      ];

      // Create achievements
      const createdAchievements = await Promise.all(
        defaultAchievements.map(achievement =>
          storage.createAchievement(achievement)
        )
      );

      res.json(createdAchievements);
    } catch (error: any) {
      console.error("Error seeding achievements:", error);
      res.status(500).json({
        message: "Failed to seed achievements",
        error: error.message
      });
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { message, subject, grade, history } = req.body;

      if (!message) {
        return res.status(400).json({
          message: "Message is required"
        });
      }

      // Get student's performance data
      const userId = 1; // TODO: Get from authenticated session
      const attempts = await storage.getAttempts(userId);

      // Initialize the chat history array
      const chatHistory = history || [];

      // Only add performance context if there are attempts
      if (attempts.length > 0) {
        // If subject is provided, filter attempts for that subject
        const relevantAttempts = subject
          ? attempts.filter(attempt => attempt.exam.subject === subject)
          : attempts;

        if (relevantAttempts.length > 0) {
          // Calculate average score safely
          const totalScore = relevantAttempts.reduce((sum, attempt) => {
            return sum + (attempt.score || 0);
          }, 0);
          const averageScore = (totalScore / relevantAttempts.length).toFixed(1);

          // Get the most recent attempt's feedback safely
          const latestAttempt = relevantAttempts[0];
          const strengths = latestAttempt?.feedback?.overall?.strengths || [];
          const improvements = latestAttempt?.feedback?.overall?.areas_for_improvement || [];

          // Add performance context as system message
          chatHistory.unshift({
            role: "system",
            content: subject && grade
              ? `Student's performance context for ${subject} (Grade ${grade}):
                - Number of attempts: ${relevantAttempts.length}
                - Average score: ${averageScore}%
                - Recent strengths: ${strengths.length ? strengths.join(", ") : "No data available"}
                - Areas for improvement: ${improvements.length ? improvements.join(", ") : "No data available"}`
              : `Student's overall performance context:
                - Total attempts: ${relevantAttempts.length}
                - Average score across subjects: ${averageScore}%`
          });
        }
      }

      const response = await generateTutorResponse(
        message,
        subject || '',
        grade || '',
        chatHistory
      );

      res.json(response);
    } catch (error: any) {
      console.error("Error in chat endpoint:", error);
      res.status(500).json({
        message: "Failed to generate response",
        error: error.message
      });
    }
  });

  // Add this new route after the existing /api/chat endpoint
  app.post("/api/chat/command", async (req, res) => {
    try {
      const { message, history } = req.body;

      if (!message) {
        return res.status(400).json({
          message: "Missing required fields"
        });
      }

      // Parse the command to understand user intent
      const command = await parseCommand(message);

      // Generate appropriate response based on the command
      const responseContent = await generateResponse(command, message);

      // Return response with action if applicable
      res.json({
        role: "assistant",
        content: responseContent,
        action: command.type !== "unknown" ? {
          type: command.type,
          data: command.data
        } : undefined
      });
    } catch (error: any) {
      console.error("Error in chat command endpoint:", error);
      res.status(500).json({
        message: "Failed to process command",
        error: error.message
      });
    }
  });

  app.post("/api/exams/:id/adjust-difficulty", async (req, res) => {
    try {
      const examId = parseInt(req.params.id);
      const { newDifficulty } = req.body;

      if (isNaN(examId)) {
        return res.status(400).json({ message: "Invalid exam ID" });
      }

      const validDifficulties = ["Beginner", "Foundation", "Easy", "Medium", "Advanced", "Hard", "Expert", "Olympiad"];
      if (!validDifficulties.includes(newDifficulty)) {
        return res.status(400).json({
          message: "Invalid difficulty level",
          validLevels: validDifficulties
        });
      }

      // Get the original exam
      const exam = await storage.getExam(examId);
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }

      // Adjust questions difficulty
      const adjustedQuestions = await adjustQuestionDifficulty(
        exam.questions,
        newDifficulty,
        exam.subject,
        exam.grade
      );

      // Create a new exam with adjusted questions
      const newExam = await storage.createExam({
        ...exam,
        difficulty: newDifficulty,
        questions: adjustedQuestions,
        templateId: exam.templateId
      });

      res.json(newExam);
    } catch (error: any) {
      console.error("Error adjusting exam difficulty:", error);
      res.status(500).json({
        message: "Failed to adjust exam difficulty",
        error: error.message
      });
    }
  });

  app.get("/api/analysis/student-skills", async (req, res) => {
    try {
      // Get attempt IDs from query params
      const attemptIds = req.query.attemptIds
        ? (req.query.attemptIds as string).split(',').map(id => parseInt(id))
        : [];

      if (!attemptIds.length) {
        return res.status(400).json({
          message: "No attempt IDs provided",
          help: "Please select one or more exam attempts to analyze skills"
        });
      }

      // Get attempts with exam data
      const attempts = await Promise.all(
        attemptIds.map(id => storage.getAttemptWithExam(id))
      );

      // Filter out any null results and log what we found
      const validAttempts = attempts.filter(a => a !== null);
      console.log(`Found ${validAttempts.length} valid attempts out of ${attemptIds.length} requested`);

      if (!validAttempts.length) {
        return res.status(404).json({
          message: "No valid attempts found",
          help: "The selected attempts may have been deleted or are not accessible"
        });
      }

      const analysis = await analyzeStudentSkills(validAttempts);
      res.json(analysis);
    } catch (error: any) {
      console.error("Error analyzing student skills:", error);
      res.status(500).json({
        message: "Failed to analyze student skills",
        error: error.message,
        help: "Please try again with different attempts or contact support if the issue persists"
      });
    }
  });

  // Update the share performance route to handle undefined values
  app.post("/api/share/performance", async (req, res) => {
    try {
      const { attemptIds, shareMethod, recipientEmail } = req.body;

      if (!attemptIds || !Array.isArray(attemptIds) || !attemptIds.length) {
        return res.status(400).json({ message: "No attempts specified" });
      }

      // Get attempts with analysis
      const attempts = await Promise.all(
        attemptIds.map(id => storage.getAttemptWithExam(id))
      );
      const validAttempts = attempts.filter(a => a !== null);

      if (!validAttempts.length) {
        return res.status(404).json({ message: "No valid attempts found" });
      }

      // Initialize the analysis structure with empty arrays
      const analysis = {
        cognitiveSkills: {
          strengths: [],
          areasForImprovement: []
        },
        subjectSkills: {
          masteredConcepts: [],
          challengingAreas: []
        },
        progressAnalysis: {
          improvements: [],
          consistentStrengths: [],
          growthAreas: []
        },
        learningStyle: {
          primaryStyle: "Visual",
          effectiveStrategies: [],
          adaptationNeeds: []
        },
        personalizedRecommendations: []
      };

      // Aggregate existing feedback from attempts
      validAttempts.forEach(attempt => {
        if (attempt?.feedback?.overall) {
          const { strengths = [], areas_for_improvement = [] } = attempt.feedback.overall;

          // Add strengths
          strengths.forEach(s => {
            if (s) {
              analysis.cognitiveSkills.strengths.push({
                skill: s,
                evidence: `Demonstrated in ${attempt.exam.subject}`,
                impactLevel: "High"
              });
            }
          });

          // Add areas for improvement
          areas_for_improvement.forEach(a => {
            if (a) {
              analysis.cognitiveSkills.areasForImprovement.push({
                skill: a,
                currentLevel: "Needs Improvement",
                suggestedApproach: `Focus on this area in ${attempt.exam.subject}`
              });
            }
          });
        }

        // Add per-question feedback
        if (attempt?.feedback?.perQuestion) {
          attempt.feedback.perQuestion.forEach(q => {
            if (q?.conceptualUnderstanding?.level === "Good" && q?.keyConceptsCovered?.length) {
              analysis.subjectSkills.masteredConcepts.push({
                concept: q.keyConceptsCovered[0],
                proficiencyLevel: "Proficient",
                evidence: q.conceptualUnderstanding.details || "Good understanding demonstrated"
              });
            }

            if (q?.improvementAreas?.length && q?.keyConceptsCovered?.length) {
              analysis.subjectSkills.challengingAreas.push({
                concept: q.keyConceptsCovered[0],
                gap: q?.misconceptions?.[0] || "Needs review",
                recommendedResources: q.improvementAreas
              });
            }
          });
        }
      });

      // Add a default recommendation if none exist
      if (analysis.personalizedRecommendations.length === 0) {
        analysis.personalizedRecommendations.push({
          focus: "General Improvement",
          actionItems: ["Review past exam questions", "Practice regularly"],
          resources: [{
            type: "Practice",
            title: "Practice Questions",
            description: "Work through sample questions to improve understanding",
            link: "#"
          }],
          expectedOutcome: "Improved overall performance"
        });
      }

      // Continue with email or link sharing using the aggregated analysis
      if (shareMethod === "email" && recipientEmail) {
        // Configure email transport
        const transporter = createTransport({
          host: process.env.SMTP_HOST || "smtp.gmail.com",
          port: parseInt(process.env.SMTP_PORT || "587"),
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });

        // Generate HTML email content
        const emailContent = `
          <h1>Student Performance Insights</h1>
          <div>
            <h2>Cognitive Skills</h2>
            <h3>Strengths</h3>
            <ul>
              ${analysis.cognitiveSkills.strengths.map(s => `
                <li>
                  <strong>${s.skill}</strong> (${s.impactLevel} Impact)<br>
                  ${s.evidence}
                </li>
              `).join('')}
            </ul>

            <h3>Areas for Improvement</h3>
            <ul>
              ${analysis.cognitiveSkills.areasForImprovement.map(a => `
                <li>
                  <strong>${a.skill}</strong><br>
                  Current Level: ${a.currentLevel}<br>
                  Suggested Approach: ${a.suggestedApproach}
                </li>
              `).join('')}
            </ul>
          </div>

          <div>
            <h2>Subject Mastery</h2>
            ${analysis.subjectSkills.masteredConcepts.map(c => `
              <div>
                <h3>${c.concept} - ${c.proficiencyLevel}</h3>
                <p>${c.evidence}</p>
              </div>
            `).join('')}
          </div>

          <div>
            <h2>Recommendations</h2>
            ${analysis.personalizedRecommendations.map(r => `
              <div>
                <h3>${r.focus}</h3>
                <ul>
                  ${r.actionItems.map(item => `<li>${item}</li>`).join('')}
                </ul>
                <h4>Recommended Resources:</h4>
                <ul>
                  ${r.resources.map(resource => `
                    <li>
                      <strong>${resource.title}</strong><br>
                      ${resource.description}
                    </li>
                  `).join('')}
                </ul>
              </div>
            `).join('')}
          </div>
        `;

        await transporter.sendMail({
          from: process.env.SMTP_USER,
          to: recipientEmail,
          subject: "Student Performance Insights Report",
          html: emailContent
        });

        res.json({ message: "Performance insights shared via email" });
      } else if (shareMethod === "link") {
        // Generate a unique share token
        const shareToken = randomUUID();

        // Store the analysis with the token
        await storage.storeSharedAnalysis(shareToken, analysis);

        // Generate shareable link
        const shareLink = `${process.env.APP_URL || req.get('origin')}/shared/performance/${shareToken}`;

        res.json({ shareLink });
      } else {
        res.status(400).json({ message: "Invalid share method" });
      }
    } catch (error: any) {
      console.error("Error sharing performance insights:", error);
      res.status(500).json({
        message: "Failed to share performance insights",
        error: error.message
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}