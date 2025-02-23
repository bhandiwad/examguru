import OpenAI from "openai";
import { ILLMProvider, CompletionRequest, CompletionResponse, ImageGenerationRequest, ImageGenerationResponse, LLMConfig } from "../types";

export class OpenAIProvider implements ILLMProvider {
  private client: OpenAI;
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
    this.client = new OpenAI({ 
      apiKey: config.apiKey,
      baseURL: config.apiEndpoint // Optional, for API-compatible services
    });
  }

  async generateCompletion(request: CompletionRequest): Promise<CompletionResponse> {
    const messages = request.messages.map(msg => ({
      role: msg.role,
      content: Array.isArray(msg.content) ? msg.content : msg.content
    }));

    const response = await this.client.chat.completions.create({
      model: this.config.modelName || "gpt-4",
      messages,
      temperature: request.temperature,
      max_tokens: request.maxTokens,
      response_format: request.responseFormat,
    });

    return {
      content: response.choices[0].message.content || "",
    };
  }

  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    const validSizes = ["256x256", "512x512", "1024x1024", "1792x1024", "1024x1792"] as const;
    const validQualities = ["standard", "hd"] as const;

    const size = validSizes.includes(request.size as any) ? request.size : "1024x1024";
    const quality = validQualities.includes(request.quality as any) ? request.quality : "standard";

    const response = await this.client.images.generate({
      model: "dall-e-3",
      prompt: request.prompt,
      n: request.n || 1,
      size: size as any,
      quality: quality as any,
    });

    return {
      url: response.data[0].url || "",
    };
  }
}