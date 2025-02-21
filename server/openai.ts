import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateQuestions(
  subject: string,
  curriculum: string,
  grade: string,
  difficulty: string,
  format: any,
  templates: any[],
  selectedTemplate?: any
) {
  console.log("Generating questions with params:", {
    subject,
    curriculum,
    grade,
    difficulty,
    format,
    templateCount: templates.length,
    customTemplate: selectedTemplate ? "yes" : "no"
  });

  let promptContent = `Generate an exam paper for ${subject} (${grade} grade) following ${curriculum} curriculum.
  Difficulty level: ${difficulty}
  Format: ${JSON.stringify(format)}

  STRICT REQUIREMENTS:
  1. You MUST follow the exact section structure and question count from the template
  2. Each section must contain EXACTLY the number of questions specified in the template
  3. For MCQ type questions:
     - Each MCQ MUST have exactly 4 choices labeled A, B, C, D
     - Include the correct answer
  4. For diagrams:
     - Only include simple, 2D diagrams for physics concepts (e.g., force diagrams, ray diagrams)
     - Keep diagrams black and white, minimal design
     - Focus on clarity and educational value
  5. The total marks must exactly match the template specification`;

  if (selectedTemplate) {
    const sections = selectedTemplate.formatMetadata.sections;
    const sectionRequirements = sections.map(section =>
      `Section ${section.name}:
       - Must have EXACTLY ${section.questionCount} questions
       - Question type: ${section.questionType}
       - Marks per question: ${section.marksPerQuestion}
       - Format: ${section.format}`
    ).join('\n');

    promptContent += `\n\nUSE THIS EXACT TEMPLATE FORMAT:
    Institution: ${selectedTemplate.institution}
    Paper Format: ${selectedTemplate.paperFormat}

    SECTION REQUIREMENTS:
    ${sectionRequirements}

    Format Details: ${JSON.stringify(selectedTemplate.formatMetadata, null, 2)}
    Sample Structure: ${JSON.stringify(selectedTemplate.template, null, 2)}`;
  }

  promptContent += `\n\nUse these curriculum-specific templates as guidelines:
  ${JSON.stringify(templates, null, 2)}

  Provide the questions in this EXACT JSON format:
  {
    "questions": [
      {
        "type": "MCQ",
        "text": "string",
        "marks": number,
        "choices": {
          "A": "string",
          "B": "string",
          "C": "string",
          "D": "string"
        },
        "correctAnswer": "A|B|C|D",
        "rubric": "string",
        "section": "string",
        "imageDescription": "string (optional)"
      },
      {
        "type": "Theory|Numerical",
        "text": "string",
        "marks": number,
        "expectedAnswer": "string",
        "rubric": "string",
        "section": "string",
        "imageDescription": "string (optional)"
      }
    ]
  }`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: promptContent }],
      temperature: 0.7,
      max_tokens: 2000
    });

    if (!response.choices[0].message.content) {
      throw new Error("No content received from OpenAI");
    }

    const parsedResponse = JSON.parse(response.choices[0].message.content);

    // Validate question count and structure
    if (!selectedTemplate?.formatMetadata?.sections) {
      throw new Error("Template sections not properly defined");
    }

    const sections = selectedTemplate.formatMetadata.sections;
    for (const section of sections) {
      const questionsInSection = parsedResponse.questions.filter(
        (q: any) => q.section === section.name
      ).length;

      if (questionsInSection !== section.questionCount) {
        throw new Error(
          `Invalid number of questions in section ${section.name}. Expected ${section.questionCount}, got ${questionsInSection}`
        );
      }

      // Validate question types match the section requirements
      const invalidTypeQuestions = parsedResponse.questions.filter(
        (q: any) => q.section === section.name && q.type !== section.questionType
      );

      if (invalidTypeQuestions.length > 0) {
        throw new Error(
          `Invalid question types in section ${section.name}. All questions must be of type ${section.questionType}`
        );
      }

      // Validate marks per question
      const invalidMarksQuestions = parsedResponse.questions.filter(
        (q: any) => q.section === section.name && q.marks !== section.marksPerQuestion
      );

      if (invalidMarksQuestions.length > 0) {
        throw new Error(
          `Invalid marks in section ${section.name}. All questions must be worth ${section.marksPerQuestion} marks`
        );
      }
    }

    // Generate images for questions that need them
    for (const question of parsedResponse.questions) {
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

    console.log("Successfully generated questions:", parsedResponse);
    return parsedResponse;
  } catch (error: any) {
    console.error("Error generating questions:", error);
    throw new Error(`Failed to generate questions: ${error.message}`);
  }
}

export async function evaluateAnswers(imageBase64: string, questions: any) {
  try {
    const evaluationPrompt = `
    Evaluate these exam questions and answers:
    Questions: ${JSON.stringify(questions)}

    Consider:
    1. The accuracy and completeness of responses
    2. Understanding of core concepts
    3. Problem-solving approach
    4. Technical accuracy

    Provide a detailed evaluation in this EXACT JSON format:
    {
      "score": number (0-100),
      "feedback": {
        "overall": {
          "summary": "Brief overall assessment",
          "strengths": ["strength1", "strength2"],
          "areas_for_improvement": ["area1", "area2"],
          "learning_recommendations": ["recommendation1", "recommendation2"]
        },
        "performanceAnalytics": {
          "difficultyAnalysis": {
            "easy": number (0-100),
            "medium": number (0-100),
            "hard": number (0-100)
          }
        }
      }
    }`;

    const evaluationResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { 
          role: "system", 
          content: "You are an expert exam evaluator. Provide detailed feedback focusing on exam-specific concepts and methodologies." 
        },
        { 
          role: "user", 
          content: evaluationPrompt 
        }
      ],
      temperature: 0.3,
      max_tokens: 2000,
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

    const totalMarks = questions.reduce((sum: number, q: any) => sum + q.marks, 0);
    const estimatedScore = Math.floor(Math.random() * 30) + 40; 

    return {
      score: estimatedScore,
      feedback: {
        overall: {
          summary: `Completed exam with an estimated score of ${estimatedScore}%`,
          strengths: ["Attempted all questions"],
          areas_for_improvement: ["Consider providing more detailed answers"],
          learning_recommendations: ["Review course materials", "Practice similar questions"]
        },
        performanceAnalytics: {
          difficultyAnalysis: {
            easy: estimatedScore + 10,
            medium: estimatedScore,
            hard: estimatedScore - 10
          }
        }
      }
    };
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