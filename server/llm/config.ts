import { LLMConfig } from "./types";
import * as fs from "fs";
import * as path from "path";

// Default configuration
export const defaultConfig: LLMConfig = {
  provider: process.env.LLM_PROVIDER || "openai",
  modelName: process.env.LLM_MODEL_NAME,
  apiKey: process.env.LLM_API_KEY,
};

function loadConfigFile(provider: string): Record<string, any> {
  try {
    const configPath = path.join(process.cwd(), "config", "llm", `${provider}.json`);
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(configContent);
    }
  } catch (error) {
    console.warn(`Warning: Could not load config file for provider ${provider}:`, error);
  }
  return {};
}

// Load configuration from environment variables and config files
export function loadConfig(): LLMConfig {
  const provider = process.env.LLM_PROVIDER || defaultConfig.provider;

  // Load provider-specific configuration from file
  const fileConfig = loadConfigFile(provider);

  // Merge configurations with priority: env vars > file config > default config
  return {
    provider,
    apiKey: process.env.LLM_API_KEY || fileConfig.apiKey || defaultConfig.apiKey,
    apiEndpoint: process.env.LLM_API_ENDPOINT || fileConfig.apiEndpoint,
    modelName: process.env.LLM_MODEL_NAME || fileConfig.modelName || defaultConfig.modelName,
    options: {
      ...fileConfig.options,
      // Override with environment variables if they exist
      temperature: parseFloat(process.env.LLM_TEMPERATURE || '') || fileConfig.options?.temperature || 0.7,
      maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '') || fileConfig.options?.maxTokens || 2000,
      // Allow any additional provider-specific options from config file
      ...fileConfig.options
    },
  };
}