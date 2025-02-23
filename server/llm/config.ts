import { LLMConfig } from "./types";

// Default configuration
export const defaultConfig: LLMConfig = {
  provider: "openai",
  modelName: "gpt-4",
  apiKey: process.env.OPENAI_API_KEY,
};

// Load configuration from environment variables or config file
export function loadConfig(): LLMConfig {
  const envProvider = process.env.LLM_PROVIDER;
  // Validate provider type
  const provider = (envProvider === "openai" || envProvider === "llama" || envProvider === "deepseek") 
    ? envProvider 
    : defaultConfig.provider;

  return {
    provider,
    apiKey: process.env.LLM_API_KEY || process.env.OPENAI_API_KEY,
    apiEndpoint: process.env.LLM_API_ENDPOINT,
    modelName: process.env.LLM_MODEL_NAME || defaultConfig.modelName,
    options: {
      // Add any provider-specific options
      temperature: parseFloat(process.env.LLM_TEMPERATURE || "0.7"),
      maxTokens: parseInt(process.env.LLM_MAX_TOKENS || "2000", 10),
    },
  };
}