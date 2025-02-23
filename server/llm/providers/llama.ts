import { ILLMProvider, CompletionRequest, CompletionResponse, LLMConfig } from "../types";

export class LlamaProvider implements ILLMProvider {
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  async generateCompletion(request: CompletionRequest): Promise<CompletionResponse> {
    const response = await fetch(this.config.apiEndpoint || "http://localhost:8000/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.config.apiKey && { Authorization: `Bearer ${this.config.apiKey}` }),
      },
      body: JSON.stringify({
        model: this.config.modelName,
        messages: request.messages,
        temperature: request.temperature,
        max_tokens: request.maxTokens,
      }),
    });

    if (!response.ok) {
      throw new Error(`Llama API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
    };
  }
}
