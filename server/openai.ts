import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateQuestions(subject: string, curriculum: string, difficulty: string, format: any) {
  console.log("Generating questions with params:", { subject, curriculum, difficulty, format });

  const prompt = `Generate an exam paper for ${subject} following ${curriculum} curriculum.
  Difficulty level: ${difficulty}
  Format: ${JSON.stringify(format)}

  Please provide the questions in JSON format with the following structure:
  {
    "questions": [
      {
        "type": "string",
        "text": "string",
        "marks": number,
        "expectedAnswer": "string"
      }
    ]
  }`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
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

export async function evaluateAnswers(imageText: string, questions: any) {
  // Truncate the answer text if it's too long
  const maxAnswerLength = 2000; // Adjust this value based on token limits
  const truncatedText = imageText.length > maxAnswerLength 
    ? imageText.substring(0, maxAnswerLength) + "... (truncated for length)"
    : imageText;

  const prompt = `Evaluate these exam answers concisely:
  Questions: ${JSON.stringify(questions)}
  Answers: ${truncatedText}

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

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", 
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    if (!response.choices[0].message.content) {
      throw new Error("No content received from OpenAI");
    }

    const parsedResponse = JSON.parse(response.choices[0].message.content);
    console.log("Successfully evaluated answers:", parsedResponse);
    return parsedResponse;
  } catch (error: any) {
    console.error("Error evaluating answers:", error);
    throw new Error(`Failed to evaluate answers: ${error.message}`);
  }
}