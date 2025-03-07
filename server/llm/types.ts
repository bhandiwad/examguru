// Types for LLM provider interface
export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string | MessageContent[];
}

export interface MessageContent {
  type: "text" | "image_url";
  text?: string;
  image_url?: {
    url: string;
  };
}

export interface LLMConfig {
  provider: string; // Generic provider identifier
  apiKey?: string;
  apiEndpoint?: string;
  modelName?: string;
  // System prompts for different contexts
  systemPrompts?: {
    default?: string;
    questionGeneration?: string;
    evaluation?: string;
    tutoring?: string;
    analysis?: string;
    custom?: Record<string, string>;
  };
  // Additional provider-specific configuration
  options?: Record<string, any>;
}

export interface CompletionRequest {
  messages: LLMMessage[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?: { type: "text" | "json_object" };
  // Optional context to select specific system prompt
  context?: "default" | "questionGeneration" | "evaluation" | "tutoring" | "analysis" | string;
}

export interface ImageGenerationRequest {
  prompt: string;
  n?: number;
  size?: string;
  quality?: string;
}

export interface CompletionResponse {
  content: string;
}

export interface ImageGenerationResponse {
  url: string;
}

// Base interface for LLM providers
export interface ILLMProvider {
  generateCompletion(request: CompletionRequest): Promise<CompletionResponse>;
  generateImage?(request: ImageGenerationRequest): Promise<ImageGenerationResponse>;
}