import type { Express } from "express";
import { createServer } from "http";
import multer from "multer";
import { storage } from "./storage";
import { generateQuestions, evaluateAnswers, analyzeQuestionPaperTemplate, generateTutorResponse } from "./openai";
import { insertExamSchema, insertAttemptSchema, insertQuestionTemplateSchema } from "@shared/schema";

// Configure multer for handling file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

export async function registerRoutes(app: Express) {
  // Template management routes
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


  // Modified exam creation to use custom templates
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

      // Get relevant templates
      const templates = await storage.getTemplates({
        curriculum: validation.data.curriculum,
        subject: validation.data.subject,
        grade: validation.data.grade
      });

      console.log("Found templates:", templates.length);

      // Get selected custom template if specified
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

      const exam = await storage.getExam(examId);
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }

      let evaluation;
      const questions = exam.questions as any[];
      const hasTheoryQuestions = questions.some(q => q.type !== 'MCQ');

      if (hasTheoryQuestions) {
        // For exams with theory questions, evaluate using image
        if (!req.file) {
          return res.status(400).json({ message: "Answer image required for theory questions" });
        }
        evaluation = await evaluateAnswers(req.file.buffer.toString('base64'), questions);
      } else {
        // For MCQ-only exams, evaluate the answers directly
        const selectedAnswers = JSON.parse(req.body.answers);
        const score = questions.reduce((total, q, index) => {
          if (q.type === 'MCQ' && selectedAnswers[index] === q.correctAnswer) {
            return total + q.marks;
          }
          return total;
        }, 0);

        const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
        const percentage = Math.round((score / totalMarks) * 100);

        evaluation = {
          score: percentage,
          feedback: {
            overall: {
              summary: `You scored ${percentage}% in this MCQ exam.`,
              strengths: percentage >= 70 ? ["Good performance in multiple choice questions"] : [],
              areas_for_improvement: percentage < 70 ? ["Review the topics where you made mistakes"] : [],
              learning_recommendations: []
            },
            perQuestion: questions.map((q, index) => ({
              questionNumber: index + 1,
              score: selectedAnswers[index] === q.correctAnswer ? q.marks : 0,
              conceptualUnderstanding: {
                level: selectedAnswers[index] === q.correctAnswer ? "Good" : "Needs Improvement",
                details: selectedAnswers[index] === q.correctAnswer ?
                  "Correctly answered" : "Incorrect answer selected"
              },
              technicalAccuracy: {
                score: selectedAnswers[index] === q.correctAnswer ? 100 : 0,
                details: selectedAnswers[index] === q.correctAnswer ?
                  "Accurate selection" : "Wrong option selected"
              },
              keyConceptsCovered: [q.text],
              misconceptions: selectedAnswers[index] !== q.correctAnswer ?
                ["Review this concept"] : [],
              improvementAreas: selectedAnswers[index] !== q.correctAnswer ?
                ["Practice similar questions"] : [],
              exemplarAnswer: `The correct answer is ${q.correctAnswer}`
            }))
          }
        };
      }

      const attempt = await storage.createAttempt({
        examId,
        userId,
        startTime,
        endTime: new Date(),
        answerImageUrl: req.file ? "data:image/jpeg;base64," + req.file.buffer.toString('base64') : undefined,
        score: evaluation.score,
        feedback: evaluation.feedback
      });

      // Check and award any new achievements
      const newAchievements = await storage.checkAndAwardAchievements(userId);

      // Return both the attempt and any new achievements
      res.json({
        attempt,
        newAchievements
      });
    } catch (error: any) {
      console.error("Error uploading attempt:", error);
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

      if (!message || !subject || !grade) {
        return res.status(400).json({
          message: "Missing required fields"
        });
      }

      const response = await generateTutorResponse(
        message,
        subject,
        grade,
        history || []
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

  const httpServer = createServer(app);
  return httpServer;
}