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

  private getSystemPrompt(context?: string): string | undefined {
    if (!this.config.systemPrompts) return undefined;

    if (!context) return this.config.systemPrompts.default;

    if (context in this.config.systemPrompts) {
      return this.config.systemPrompts[context as keyof typeof this.config.systemPrompts];
    }

    // Check custom prompts if context not found in standard ones
    return this.config.systemPrompts.custom?.[context];
  }

  async generateCompletion(request: CompletionRequest): Promise<CompletionResponse> {
    // Get appropriate system prompt based on context
    const systemPrompt = this.getSystemPrompt(request.context);

    // If there's a system prompt and no system message in request, add it
    const messages = systemPrompt && !request.messages.some(msg => msg.role === 'system')
      ? [{ role: 'system' as const, content: systemPrompt }, ...request.messages]
      : request.messages;

    // Convert our generic message format to OpenAI's chat API format
    const formattedMessages = messages.map(msg => {
      const messageBase = {
        role: msg.role,
        content: typeof msg.content === 'string' ? msg.content : undefined
      };

      // Handle array content format for multimodal messages
      if (Array.isArray(msg.content)) {
        return {
          ...messageBase,
          content: msg.content.map(content => {
            if (content.type === 'text') {
              return { type: 'text', text: content.text };
            } else {
              return { type: 'image_url', image_url: content.image_url };
            }
          })
        };
      }

      return messageBase;
    });

    const response = await this.client.chat.completions.create({
      model: this.config.modelName || "gpt-4",
      messages: formattedMessages as any, // Type assertion needed due to OpenAI types limitation
      temperature: request.temperature,
      max_tokens: request.maxTokens,
      response_format: request.responseFormat,
    });

    return {
      content: response.choices[0].message.content || "",
    };
  }

  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    const response = await this.client.images.generate({
      model: "dall-e-3",
      prompt: request.prompt,
      n: request.n || 1,
      size: (request.size || "1024x1024") as any,
      quality: (request.quality || "standard") as any,
    });

    return {
      url: response.data[0].url || "",
    };
  }
}