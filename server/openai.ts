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
    // First, analyze the image to extract text and context
    const visionResponse = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",  // Using vision model for image analysis
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please analyze this exam answer sheet carefully. For each answer, identify:\n" +
                    "1. The key concepts covered\n" +
                    "2. The accuracy and completeness of the response\n" +
                    "3. The clarity and organization of the answer\n" +
                    "4. Any misconceptions or areas for improvement"
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
      max_tokens: 1500,
    });

    const extractedText = visionResponse.choices[0].message.content || "";
    console.log("Detailed analysis from image:", extractedText);

    // Enhanced evaluation with detailed rubric
    const evaluationPrompt = `
    Perform a comprehensive evaluation of these exam answers:
    Questions: ${JSON.stringify(questions)}
    Answers: ${extractedText}

    Provide a detailed evaluation in this EXACT JSON format:
    {
      "score": 85,
      "feedback": {
        "overall": {
          "summary": "Good understanding of core concepts with some areas for improvement",
          "strengths": ["Clear explanation of key concepts", "Well-structured responses"],
          "areas_for_improvement": ["More detailed examples needed", "Better mathematical notation"],
          "learning_recommendations": ["Review chapter 5", "Practice problem-solving"]
        },
        "perQuestion": [
          {
            "questionNumber": 1,
            "score": 90,
            "conceptualUnderstanding": {
              "level": "Excellent",
              "details": "Shows deep understanding of the concept"
            },
            "technicalAccuracy": {
              "score": 85,
              "details": "Minor calculation errors"
            },
            "keyConceptsCovered": ["Integration", "Derivatives"],
            "misconceptions": ["None identified"],
            "improvementAreas": ["Show more steps"],
            "exemplarAnswer": "A complete solution would include..."
          }
        ],
        "performanceAnalytics": {
          "conceptualStrengths": ["Mathematical reasoning", "Problem analysis"],
          "technicalStrengths": ["Calculation accuracy", "Formula application"],
          "learningPatterns": ["Strong in theory", "Needs practice in application"],
          "recommendedTopics": ["Complex numbers", "Vector calculus"],
          "difficultyAnalysis": {
            "easy": 95,
            "medium": 85,
            "hard": 75
          }
        }
      }
    }`;

    const evaluationResponse = await openai.chat.completions.create({
      model: "gpt-4",  // Using standard GPT-4 for evaluation
      messages: [{ role: "user", content: evaluationPrompt }],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    });

    if (!evaluationResponse.choices[0].message.content) {
      throw new Error("No evaluation content received from OpenAI");
    }

    const parsedResponse = JSON.parse(evaluationResponse.choices[0].message.content);
    console.log("Advanced evaluation completed:", parsedResponse);
    return parsedResponse;
  } catch (error: any) {
    console.error("Error in advanced evaluation:", error);
    throw new Error(`Failed to evaluate answers: ${error.message}`);
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