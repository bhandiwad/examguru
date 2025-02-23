import { ILLMProvider } from "../types";

export async function validateProvider(provider: ILLMProvider): Promise<boolean> {
  try {
    // Test basic completion functionality
    const response = await provider.generateCompletion({
      messages: [
        {
          role: "user",
          content: "Test message for provider validation"
        }
      ],
      temperature: 0.7,
      maxTokens: 50
    });

    if (!response.content) {
      throw new Error("Provider returned empty content");
    }

    console.log("LLM provider validation successful");
    return true;
  } catch (error) {
    console.error("LLM provider validation failed:", error);
    return false;
  }
}
