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

export async function generateTutorResponse(
  message: string,
  subject: string,
  grade: string,
  history: { role: string; content: string }[]
) {
  try {
    const systemPrompt = `You are an expert tutor specializing in ${subject} for Grade ${grade} students.
    Your role is to:
    1. Provide clear, age-appropriate explanations
    2. Break down complex concepts into simpler terms
    3. Use examples and analogies relevant to the student's grade level
    4. Guide students to understand concepts rather than just giving answers
    5. Encourage critical thinking and problem-solving
    6. Maintain a supportive and encouraging tone
    7. Provide step-by-step explanations when solving problems
    8. Reference relevant curriculum concepts and learning objectives

    Remember:
    - Keep explanations concise but thorough
    - Use encouraging language
    - If a student is struggling, break down the concept into smaller parts
    - Suggest additional resources when appropriate
    - If a student asks for direct homework answers, guide them through the problem-solving process instead`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: message }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    if (!response.choices[0].message.content) {
      throw new Error("No response generated");
    }

    return {
      role: "assistant",
      content: response.choices[0].message.content
    };
  } catch (error: any) {
    console.error("Error generating tutor response:", error);
    throw new Error(`Failed to generate tutor response: ${error.message}`);
  }
}

// Add new difficulty adjustment function
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
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert exam question generator specializing in adapting question difficulty while maintaining educational value. You must respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7
    });

    if (!response.choices[0].message.content) {
      throw new Error("No content received from OpenAI");
    }

    const adjustedQuestions = JSON.parse(response.choices[0].message.content);
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
    const prompt = `Analyze this student's exam performance data and provide a detailed assessment of their strengths and areas for improvement.

    Exam attempts and performance data:
    ${JSON.stringify(attempts, null, 2)}

    Provide a comprehensive analysis focusing on:
    1. Core academic strengths (e.g., logical reasoning, conceptual understanding, problem-solving)
    2. Learning style strengths (e.g., visual learning, practical application)
    3. Subject-specific strengths
    4. Areas needing improvement
    5. Specific actionable recommendations

    Respond in this exact JSON format:
    {
      "strengths": [
        "detailed strength description 1",
        "detailed strength description 2"
      ],
      "areasForImprovement": [
        "detailed area for improvement 1",
        "detailed area for improvement 2"
      ],
      "recommendations": [
        "specific actionable recommendation 1",
        "specific actionable recommendation 2"
      ]
    }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert educational analyst specializing in identifying student strengths and learning needs. Provide specific, actionable insights."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    if (!response.choices[0].message.content) {
      throw new Error("No content received from OpenAI");
    }

    return JSON.parse(response.choices[0].message.content);
  } catch (error: any) {
    console.error("Error analyzing student skills:", error);
    throw new Error(`Failed to analyze student skills: ${error.message}`);
  }
}