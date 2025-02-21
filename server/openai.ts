import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
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
  Format: ${JSON.stringify(format)}`;

  if (selectedTemplate) {
    promptContent += `\n\nUse this specific institution's format:
    Institution: ${selectedTemplate.institution}
    Paper Format: ${selectedTemplate.paperFormat}
    Format Details: ${JSON.stringify(selectedTemplate.formatMetadata, null, 2)}
    Sample Structure: ${JSON.stringify(selectedTemplate.template, null, 2)}`;
  }

  promptContent += `\n\nUse these curriculum-specific templates as guidelines:
  ${JSON.stringify(templates, null, 2)}

  Please provide the questions in JSON format with the following structure:
  {
    "questions": [
      {
        "type": "string",
        "text": "string",
        "marks": number,
        "expectedAnswer": "string",
        "rubric": "string",
        "section": "string"
      }
    ]
  }

  Ensure that:
  1. Questions follow the curriculum standards and institution format (if specified)
  2. Each question matches the template structure
  3. Difficulty level is appropriate for the grade
  4. Total marks match the format specification
  5. Questions maintain the style and structure of the institution's format (if specified)`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: promptContent }],
      response_format: { type: "json_object" }
    });

    if (!response.choices[0].message.content) {
      throw new Error("No content received from OpenAI");
    }

    const parsedResponse = JSON.parse(response.choices[0].message.content);
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
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please read this exam answer sheet and provide the answers in a clear text format."
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
    });

    const extractedText = visionResponse.choices[0].message.content || "";
    console.log("Extracted text from image:", extractedText);

    // Now evaluate the answers
    const evaluationPrompt = `Evaluate these exam answers concisely:
    Questions: ${JSON.stringify(questions)}
    Answers: ${extractedText}

    Provide evaluation in JSON format:
    {
      "score": number,
      "feedback": {
        "overall": "string",
        "perQuestion": [
          {
            "questionNumber": number,
            "score": number,
            "feedback": "string"
          }
        ]
      }
    }`;

    const evaluationResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: evaluationPrompt }],
      response_format: { type: "json_object" }
    });

    if (!evaluationResponse.choices[0].message.content) {
      throw new Error("No evaluation content received from OpenAI");
    }

    const parsedResponse = JSON.parse(evaluationResponse.choices[0].message.content);
    console.log("Successfully evaluated answers:", parsedResponse);
    return parsedResponse;
  } catch (error: any) {
    console.error("Error evaluating answers:", error);
    throw new Error(`Failed to evaluate answers: ${error.message}`);
  }
}