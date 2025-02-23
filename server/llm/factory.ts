import { LLMConfig, ILLMProvider } from "./types";
import { OpenAIProvider } from "./providers/openai";
import { LlamaProvider } from "./providers/llama";
import { loadConfig } from "./config";

export class LLMFactory {
  static createProvider(config: LLMConfig = loadConfig()): ILLMProvider {
    switch (config.provider) {
      case "openai":
        return new OpenAIProvider(config);
      case "llama":
        return new LlamaProvider(config);
      // Add more providers here
      default:
        throw new Error(`Unsupported LLM provider: ${config.provider}`);
    }
  }
}

// Export a default instance using the configuration
export const defaultProvider = LLMFactory.createProvider();
