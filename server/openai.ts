import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
  if (difficulty === "Hard") {
    difficultyGuidelines = `
    Since difficulty level is HARD, ensure questions are genuinely challenging:
    1. Complex Problem-Solving:
       - Multi-step problems requiring multiple concepts
       - Application of concepts in non-standard situations
       - Problems requiring deep analytical thinking

    2. Advanced Concepts:
       - Questions that combine multiple chapters/topics
       - Problems requiring thorough understanding of prerequisites
       - Higher-order thinking questions (analysis, evaluation, creation)

    3. Specific Requirements by Subject:
       For Mathematics:
       - Complex word problems requiring multiple mathematical concepts
       - Problems involving proof and mathematical reasoning
       - Questions requiring creative problem-solving approaches

       For Physics:
       - Complex numerical problems with multiple concepts
       - Advanced theoretical questions
       - Real-world applications with multiple variables

       For Chemistry:
       - Complex reaction mechanisms
       - Multi-step stoichiometry problems
       - Advanced theoretical concepts

    4. Question Characteristics:
       - Include tricky edge cases
       - Require deep conceptual understanding
       - Challenge common misconceptions
       - Test application in unfamiliar contexts`;
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

  Your response MUST be a valid JSON object with this exact structure:
  {
    "questions": [
      {
        "type": "MCQ",
        "text": "question text",
        "marks": 10,
        "choices": {
          "A": "choice text",
          "B": "choice text",
          "C": "choice text",
          "D": "choice text"
        },
        "correctAnswer": "A|B|C|D",
        "rubric": "evaluation criteria",
        "section": "theory|problems",
        "chapter": "chapter name",
        "topic": "specific topic",
        "keyConcepts": ["concept1", "concept2"],
        "studyResources": ["resource1", "resource2"],
        "imageDescription": "optional"
      }
    ]
  }`;

  try {
    console.log("Sending prompt to OpenAI");
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert exam question generator specializing in creating challenging questions. You must respond with a valid JSON object containing a questions array. Each question must follow the specified format exactly."
        },
        {
          role: "user",
          content: promptContent
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    if (!response.choices[0].message.content) {
      throw new Error("No content received from OpenAI");
    }

    console.log("Received response from OpenAI");
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(response.choices[0].message.content);
      console.log("Successfully parsed OpenAI response");
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", parseError);
      throw new Error("Invalid JSON response from OpenAI");
    }

    // Handle both direct questions array and nested sections format
    let questions = parsedResponse.questions;
    if (!questions && parsedResponse.sections) {
      questions = parsedResponse.sections.flatMap((section: any) => section.questions || []);
    }

    if (!questions || !Array.isArray(questions)) {
      console.error("Invalid response structure:", parsedResponse);
      throw new Error("OpenAI response missing questions array");
    }

    // Validate required fields
    for (const question of questions) {
      if (!question.type || !question.text || !question.marks || !question.section ||
        !question.chapter || !question.topic || !question.keyConcepts || !question.studyResources) {
        throw new Error("Questions must include all required fields");
      }

      if (question.type === "MCQ" && (!question.choices || !question.correctAnswer)) {
        throw new Error("MCQ questions must include choices and correct answer");
      }
    }

    // Generate images for questions that need them
    for (const question of questions) {
      if (question.imageDescription) {
        try {
          const imageResponse = await openai.images.generate({
            model: "dall-e-3",
            prompt: `Create a simple, 2D black and white diagram for a physics question: ${question.imageDescription}. 
            The diagram should be minimalist, clear, and focus on the key physics concept. 
            Use only black lines on white background, no colors or shading.`,
            n: 1,
            size: "1024x1024",
            quality: "standard",
          });

          question.image = imageResponse.data[0].url;
        } catch (error) {
          console.error("Failed to generate image for question:", error);
          // Continue without the image if generation fails
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
    const evaluationPrompt = `
You are evaluating a mathematics exam. Here are the questions and student's answers:

Questions with correct answers and rubrics: ${JSON.stringify(questions, null, 2)}
Student's answer image is provided.

Evaluation Rules:
1. For MCQ questions:
   - Compare student's selected option with the correct answer
   - Award full marks for correct answers
   - Zero marks for incorrect answers

2. For theory/numerical questions:
   - Check solution steps visible in the answer image
   - Follow the provided rubric strictly
   - Award partial marks based on correct steps
   - Look for mathematical reasoning and proof

3. For each question provide:
   - Detailed scoring breakdown
   - Specific feedback on mistakes
   - Conceptual understanding assessment
   - Improvement suggestions
   - Topic-specific study resources including:
     * Video tutorials from Khan Academy or similar platforms
     * Interactive practice problems
     * Relevant textbook sections or articles
     * Online simulations or tools when applicable

4. Learning recommendations should:
   - Be specific to the topics where improvement is needed
   - Include clear action items
   - Link to concrete learning resources
   - Suggest practice problems
   - Consider the student's current understanding level

Your evaluation must be detailed and provided in this EXACT JSON format:
{
  "score": number (0-100),
  "feedback": {
    "overall": {
      "summary": "Brief overall assessment",
      "strengths": ["strength1", "strength2"],
      "areas_for_improvement": ["area1", "area2"],
      "learning_recommendations": [
        {
          "topic": "string",
          "recommendation": "string",
          "resources": [
            {
              "type": "video|article|practice",
              "title": "string",
              "description": "string",
              "link": "string (optional)"
            }
          ]
        }
      ]
    },
    "questions": [
      {
        "questionNumber": number,
        "isCorrect": boolean,
        "score": number,
        "chapter": "string",
        "topic": "string",
        "conceptualUnderstanding": {
          "level": "Excellent|Good|Fair|Needs Improvement",
          "details": "string"
        },
        "misconceptions": ["string"],
        "studyResources": [
          {
            "type": "video|article|practice",
            "title": "string",
            "description": "string",
            "link": "string (optional)"
          }
        ]
      }
    ],
    "performanceAnalytics": {
      "byChapter": {
        "chapterName": {
          "score": number,
          "topics": ["string"],
          "recommendations": ["string"],
          "resources": [
            {
              "type": "video|article|practice",
              "title": "string",
              "description": "string",
              "link": "string (optional)"
            }
          ]
        }
      },
      "difficultyAnalysis": {
        "easy": number (0-100),
        "medium": number (0-100),
        "hard": number (0-100)
      }
    }
  }
}`;

    const evaluationResponse = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: evaluationPrompt
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
      max_tokens: 4000,
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    if (!evaluationResponse.choices[0].message.content) {
      throw new Error("No evaluation content received");
    }

    try {
      const parsedResponse = JSON.parse(evaluationResponse.choices[0].message.content);
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
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
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
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    if (!response.choices[0].message.content) {
      throw new Error("No content received from OpenAI");
    }

    const template = JSON.parse(response.choices[0].message.content);
    console.log("Extracted template structure:", template);
    return template;
  } catch (error: any) {
    console.error("Error analyzing question paper:", error);
    throw new Error(`Failed to analyze question paper: ${error.message}`);
  }
}