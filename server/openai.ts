import { getDefaultProvider } from "./llm/factory";
import { CompletionRequest, ImageGenerationRequest, LLMMessage } from "./llm/types";

export async function generateQuestions(
  subject: string,
  curriculum: string,
  grade: string,
  difficulty: string,
  format: any,
  templates: any[],
  selectedTemplate?: any,
  chapters?: string[]
) {
  console.log("Generating questions with params:", {
    subject,
    curriculum,
    grade,
    difficulty,
    format,
    templateCount: templates.length,
    customTemplate: selectedTemplate ? "yes" : "no",
    chapters
  });

  let difficultyGuidelines = "";
  switch (difficulty) {
    case "Beginner":
      difficultyGuidelines = `
      Focus on foundational concepts:
      1. Basic definitions and terminology
      2. Simple, direct questions
      3. Clear, straightforward language
      4. Single-concept problems
      5. Step-by-step solutions`;
      break;
    case "Foundation":
      difficultyGuidelines = `
      Build core understanding:
      1. Basic concept applications
      2. Simple problem-solving
      3. Clear examples
      4. Fundamental principles
      5. Standard textbook-style questions`;
      break;
    case "Easy":
      difficultyGuidelines = `
      Reinforce learning:
      1. Direct application of concepts
      2. Simple multi-step problems
      3. Clear context
      4. Basic analytical thinking
      5. Standard problem formats`;
      break;
    case "Medium":
      difficultyGuidelines = `
      Challenge understanding:
      1. Combined concept application
      2. Moderate complexity
      3. Some analytical thinking
      4. Real-world applications
      5. Multi-step problems`;
      break;
    case "Advanced":
      difficultyGuidelines = `
      Test deeper understanding:
      1. Complex problem-solving
      2. Multiple concept integration
      3. Advanced applications
      4. Higher-order thinking
      5. Competitive exam style questions`;
      break;
    case "Hard":
      difficultyGuidelines = `
      Push boundaries:
      1. Complex multi-step problems
      2. Multiple concept integration
      3. Advanced analytical thinking
      4. Challenging applications
      5. Previous year competitive questions`;
      break;
    case "Expert":
      difficultyGuidelines = `
      Challenge mastery:
      1. Advanced problem-solving techniques
      2. Complex theoretical applications
      3. Deep conceptual understanding
      4. Multiple solution approaches
      5. Previous year advanced problems`;
      break;
    case "Olympiad":
      difficultyGuidelines = `
      Test exceptional ability:
      1. Olympiad-level complexity
      2. Novel problem-solving approaches
      3. Creative thinking requirements
      4. Research-level concepts
      5. International Olympiad style`;
      break;
  }

  const formatInstructions = format.sections.map((section: any) => `
    Generate ${Math.floor(section.marks / 10)} questions for the ${section.type} section worth 10 marks each.
    For ${section.type} questions:
    - Focus on ${section.type === 'theory' ? 'conceptual understanding and detailed explanations' : 'numerical problems and practical applications'}
    - Include complex, multi-step problems
    - Ensure detailed rubrics for evaluation
  `).join('\n');

  let promptContent = `Generate challenging exam questions for ${subject} (${grade} grade) following ${curriculum} curriculum.
  Difficulty level: ${difficulty}
  ${chapters ? `Focus on these chapters/topics: ${chapters.join(", ")}` : ""}

  ${difficultyGuidelines}

  Question Distribution:
  ${formatInstructions}

  STRICT REQUIREMENTS:
  1. Each question must be properly formatted and include:
     - Question text
     - Marks (10 marks per question)
     - Type (MCQ or Theory)
     - Section name
     - Chapter/topic
     - Key concepts being tested
     - Study resources

  2. For MCQ questions:
     - MUST have exactly 4 choices labeled A, B, C, D
     - Include the correct answer
     - For Hard difficulty: Make distractors very close to the correct answer
     - Each MCQ worth 10 marks

  3. For theory questions:
     - Include clear evaluation rubrics
     - Specify expected answer components
     - Each theory question worth 10 marks

  4. For diagrams (if needed):
     - Only include simple, 2D diagrams
     - Keep black and white, minimal design
     - Focus on clarity and educational value

  Your response must be a valid JSON string with questions array containing question objects.
  Each question object must include: type, text, marks, choices (for MCQ), correctAnswer (for MCQ), rubric, section, chapter, topic, keyConcepts, and studyResources.`;

  try {
    console.log("Sending prompt to LLM provider");
    const response = await getDefaultProvider().generateCompletion({
      messages: [
        {
          role: "user" as const,
          content: promptContent
        }
      ],
      temperature: 0.7,
      maxTokens: 2000,
      context: "questionGeneration" // This will use the question generation system prompt
    });

    if (!response.content) {
      throw new Error("No content received from LLM provider");
    }

    console.log("Received response from LLM provider");
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(response.content);
      console.log("Successfully parsed LLM response");
    } catch (parseError) {
      console.error("Failed to parse LLM response:", parseError);
      throw new Error("Invalid JSON response from LLM provider");
    }

    let questions = parsedResponse.questions;
    if (!questions && parsedResponse.sections) {
      questions = parsedResponse.sections.flatMap((section: any) => section.questions || []);
    }

    if (!questions || !Array.isArray(questions)) {
      console.error("Invalid response structure:", parsedResponse);
      throw new Error("LLM response missing questions array");
    }

    for (const question of questions) {
      if (!question.type || !question.text || !question.marks || !question.section ||
        !question.chapter || !question.topic || !question.keyConcepts || !question.studyResources) {
        throw new Error("Questions must include all required fields");
      }

      if (question.type === "MCQ" && (!question.choices || !question.correctAnswer)) {
        throw new Error("MCQ questions must include choices and correct answer");
      }
    }

    for (const question of questions) {
      if (question.imageDescription) {
        try {
          const imageResponse = await getDefaultProvider().generateImage?.({
            prompt: `Create a simple, 2D black and white diagram for a physics question: ${question.imageDescription}. 
            The diagram should be minimalist, clear, and focus on the key physics concept. 
            Use only black lines on white background, no colors or shading.`,
            n: 1,
            size: "1024x1024",
            quality: "standard",
          });

          if (imageResponse) {
            question.image = imageResponse.url;
          }
        } catch (error) {
          console.error("Failed to generate image for question:", error);

        }
      }
    }

    return { questions };
  } catch (error: any) {
    console.error("Error generating questions:", error);
    throw new Error(`Failed to generate questions: ${error.message}`);
  }
}

export async function evaluateAnswers(imageBase64: string, questions: any) {
  try {
    const response = await getDefaultProvider().generateCompletion({
      messages: [
        {
          role: "user" as const,
          content: `Analyze these exam answers and evaluate them based on these questions:
          ${JSON.stringify(questions, null, 2)}

          Follow these evaluation rules:
          1. For MCQ questions:
             - Compare student's selected option with correct answer
             - Award full marks for correct answers
             - Zero marks for incorrect answers

          2. For theory/numerical questions:
             - Check solution steps visible in the answer
             - Follow the provided rubric strictly
             - Award partial marks based on correct steps
             - Look for mathematical reasoning and proof

          3. For each question provide:
             - Detailed scoring breakdown
             - Specific feedback on mistakes
             - Conceptual understanding assessment
             - Improvement suggestions
             - Topic-specific study resources

          Important: Respond in JSON format with this structure:
          {
            "score": number (0-100),
            "feedback": {
              "overall": {
                "summary": string,
                "strengths": string[],
                "areas_for_improvement": string[],
                "learning_recommendations": object[]
              },
              "perQuestion": [
                {
                  "questionNumber": number,
                  "score": number,
                  "conceptualUnderstanding": {
                    "level": string,
                    "details": string
                  },
                  "technicalAccuracy": {
                    "score": number,
                    "details": string
                  },
                  "keyConceptsCovered": string[],
                  "misconceptions": string[],
                  "improvementAreas": string[],
                  "exemplarAnswer": string
                }
              ]
            }
          }`
        }
      ],
      maxTokens: 4000,
      temperature: 0.3,
      context: "evaluation"
    });

    if (!response.content) {
      throw new Error("No evaluation content received");
    }

    try {
      const parsedResponse = JSON.parse(response.content);
      console.log("Evaluation completed successfully:", parsedResponse);
      return parsedResponse;
    } catch (parseError) {
      console.error("Failed to parse evaluation response:", parseError);
      throw new Error("Invalid evaluation response format");
    }
  } catch (error: any) {
    console.error("Error in evaluation:", error);
    throw error;
  }
}

export async function analyzeQuestionPaperTemplate(imageBase64: string) {
  try {
    const response = await getDefaultProvider().generateCompletion({
      messages: [
        {
          role: "user" as const,
          content: [
            {
              type: "text",
              text: `Analyze this question paper image and extract its format structure.
              Focus on:
              1. Identifying distinct sections
              2. Number of questions in each section
              3. Question types (MCQ, Theory, Numerical)
              4. Marks distribution
              5. Any special instructions or format rules

              Provide the analysis in this exact JSON format:
              {
                "sections": [
                  {
                    "name": "string (e.g., 'Section A')",
                    "questionCount": number,
                    "questionType": "MCQ|Theory|Numerical|Mixed",
                    "marksPerQuestion": number,
                    "format": "string (any special instructions)"
                  }
                ],
                "totalMarks": number,
                "duration": number (in minutes),
                "specialInstructions": ["string"]
              }`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ],
        },
      ],
      maxTokens: 1000,
      responseFormat: { type: "json_object" }
    });

    if (!response.content) {
      throw new Error("No content received from LLM provider");
    }

    const template = JSON.parse(response.content);
    console.log("Extracted template structure:", template);
    return template;
  } catch (error: any) {
    console.error("Error analyzing question paper:", error);
    throw new Error(`Failed to analyze question paper: ${error.message}`);
  }
}

export async function generateTutorResponse(
  message: string,
  subject: string,
  grade: string,
  history: { role: "system" | "user" | "assistant"; content: string }[]
) {
  try {
    const systemPrompt = subject && grade
      ? `You are an expert tutor specializing in ${subject} for Grade ${grade} students.
        Your role is to:
        1. Provide clear, age-appropriate explanations
        2. Break down complex concepts into simpler terms
        3. Use examples and analogies relevant to the student's grade level
        4. Guide students to understand concepts rather than just giving answers
        5. Encourage critical thinking and problem-solving
        6. Maintain a supportive and encouraging tone
        7. Provide step-by-step explanations when solving problems
        8. Reference relevant curriculum concepts and learning objectives
        9. Suggest specific practice exercises when appropriate
        10. Include links to relevant Khan Academy or similar educational resources`
      : `You are ExamGuru's AI Assistant, specialized in education and learning.
        Your role is to:
        1. Help users navigate the ExamGuru platform
        2. Provide guidance on exam creation and management
        3. Offer study tips and learning strategies
        4. Help interpret performance analytics
        5. Suggest ways to improve learning outcomes
        6. Guide users in creating effective question templates
        7. Help understand different exam formats and structures
        8. Provide general academic advice and study techniques
        9. Assist with educational resource recommendations
        10. Maintain a helpful and encouraging tone`;

    const messages: LLMMessage[] = [
      { role: "system" as const, content: systemPrompt },
      ...history.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: "user" as const, content: message }
    ];

    const response = await getDefaultProvider().generateCompletion({
      messages,
      temperature: 0.7,
      maxTokens: 1000,
      context: "tutoring"
    });

    if (!response.content) {
      throw new Error("No response generated");
    }

    return {
      role: "assistant" as const,
      content: response.content
    };
  } catch (error: any) {
    console.error("Error generating tutor response:", error);
    throw new Error(`Failed to generate tutor response: ${error.message}`);
  }
}

export async function adjustQuestionDifficulty(
  questions: any[],
  newDifficulty: string,
  subject: string,
  grade: string
) {
  console.log("Adjusting difficulty to:", newDifficulty);

  let difficultyGuidelines = "";
  if (newDifficulty === "Hard") {
    difficultyGuidelines = `
    Increase complexity by:
    1. Adding multi-step problem solving
    2. Combining multiple concepts
    3. Including advanced applications
    4. Requiring deeper analysis
    5. Using more complex language and technical terms`;
  } else if (newDifficulty === "Easy") {
    difficultyGuidelines = `
    Simplify by:
    1. Breaking down into basic steps
    2. Using straightforward language
    3. Focusing on core concepts
    4. Providing more context
    5. Using simpler examples`;
  }

  const prompt = `
  Adjust these ${subject} questions for Grade ${grade} to ${newDifficulty} difficulty level.
  Original questions: ${JSON.stringify(questions, null, 2)}

  ${difficultyGuidelines}

  Requirements:
  1. Maintain the same core concepts and learning objectives
  2. Keep the question structure consistent
  3. Adjust complexity while ensuring curriculum alignment
  4. Update scoring rubrics accordingly
  5. Maintain MCQ format for MCQ questions
  6. Keep the same number of questions

  IMPORTANT: Your response must be ONLY valid JSON in this format:
  {"questions": [...array of adjusted questions with same structure as input...]}`;

  try {
    const response = await getDefaultProvider().generateCompletion({
      messages: [
        {
          role: "system" as const,
          content: "You are an expert exam question generator specializing in adapting question difficulty while maintaining educational value. You must respond with valid JSON only."
        },
        {
          role: "user" as const,
          content: prompt
        }
      ],
      temperature: 0.7
    });

    if (!response.content) {
      throw new Error("No content received from LLM provider");
    }

    const adjustedQuestions = JSON.parse(response.content);
    console.log("Successfully adjusted questions difficulty");

    if (!adjustedQuestions.questions || !Array.isArray(adjustedQuestions.questions)) {
      throw new Error("Invalid response format from OpenAI");
    }

    return adjustedQuestions.questions;
  } catch (error: any) {
    console.error("Error adjusting question difficulty:", error);
    throw new Error(`Failed to adjust question difficulty: ${error.message}`);
  }
}

export async function analyzeStudentSkills(attempts: any[]) {
  try {
    const prompt = `Analyze this student's exam performance data and provide a comprehensive skills assessment. 
    Consider their progress over time and identify patterns in their learning.

    Exam attempts and performance data:
    ${JSON.stringify(attempts, null, 2)}

    Analyze the following aspects in detail:
    1. Cognitive Skills:
       - Critical thinking and problem-solving approach
       - Analytical abilities
       - Conceptual understanding depth
       - Pattern recognition capabilities
       - Memory and retention

    2. Subject-Specific Skills:
       - Core concepts mastery
       - Application of theories
       - Mathematical/scientific reasoning
       - Writing and expression abilities

    3. Learning Style:
       - Preferred learning methods
       - Information processing patterns
       - Time management and exam strategy
       - Response patterns under pressure

    4. Progress Tracking:
       - Improvement trends
       - Consistent strengths
       - Areas showing growth
       - Persistent challenges

    5. Detailed Recommendations:
       - Specific study techniques
       - Resource recommendations
       - Practice strategies
       - Time management tips

    Respond in this exact JSON format:
    {
      "cognitiveSkills": {
        "strengths": [
          {
            "skill": "string",
            "evidence": "string",
            "impactLevel": "High|Medium|Low"
          }
        ],
        "areasForImprovement": [
          {
            "skill": "string",
            "currentLevel": "string",
            "suggestedApproach": "string"
          }
        ]
      },
      "subjectSkills": {
        "masteredConcepts": [
          {
            "concept": "string",
            "proficiencyLevel": "Expert|Proficient|Developing",
            "evidence": "string"
          }
        ],
        "challengingAreas": [
          {
            "concept": "string",
            "gap": "string",
            "recommendedResources": ["string"]
          }
        ]
      },
      "learningStyle": {
        "primaryStyle": "string",
        "effectiveStrategies": ["string"],
        "adaptationNeeds": ["string"]
      },
      "progressAnalysis": {
        "improvements": [
          {
            "area": "string",
            "fromLevel": "string",
            "toLevel": "string",
            "timeframe": "string"
          }
        ],
        "consistentStrengths": ["string"],
        "growthAreas": ["string"]
      },
      "personalizedRecommendations": [
        {
          "focus": "string",
          "actionItems": ["string"],
          "resources": [
            {
              "type": "Video|Article|Practice|Tool",
              "title": "string",
              "description": "string",
              "link": "string"
            }
          ],
          "expectedOutcome": "string"
        }
      ]
    }`;

    const response = await getDefaultProvider().generateCompletion({
      messages: [
        {
          role: "system" as const,
          content: "You are an expert educational analyst specializing in identifying student strengths, learning styles, and providing detailed, actionable insights. Your analysis should be specific, evidence-based, and focused on practical improvements."
        },
        {
          role: "user" as const,
          content: prompt
        }
      ],
      temperature: 0.7,
      responseFormat: { type: "json_object" },
      context: "analysis"
    });

    if (!response.content) {
      throw new Error("No content received from LLM provider");
    }

    return JSON.parse(response.content);
  } catch (error: any) {
    console.error("Error analyzing student skills:", error);
    throw new Error(`Failed to analyze student skills: ${error.message}`);
  }
}