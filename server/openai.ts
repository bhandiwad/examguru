import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateQuestions(subject: string, curriculum: string, difficulty: string, format: any) {
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

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" }
  });

  if (!response.choices[0].message.content) {
    throw new Error("Failed to generate questions");
  }

  return JSON.parse(response.choices[0].message.content);
}

export async function evaluateAnswers(imageText: string, questions: any) {
  const prompt = `Evaluate these exam answers:
  Questions: ${JSON.stringify(questions)}
  Answers: ${imageText}

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

  const response = await openai.chat.completions.create({
    model: "gpt-4o", 
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" }
  });

  if (!response.choices[0].message.content) {
    throw new Error("Failed to evaluate answers");
  }

  return JSON.parse(response.choices[0].message.content);
}