import { LLMConfig, ILLMProvider } from "./types";
import { loadConfig } from "./config";

// Provider class registry
const providers = new Map<string, new (config: LLMConfig) => ILLMProvider>();

// Keep track of initialization state
let isInitialized = false;
let defaultProviderInstance: ILLMProvider | null = null;

export function registerLLMProvider(
  providerName: string,
  providerClass: new (config: LLMConfig) => ILLMProvider
) {
  providers.set(providerName, providerClass);
}

export class LLMFactory {
  static createProvider(config: LLMConfig = loadConfig()): ILLMProvider {
    const ProviderClass = providers.get(config.provider);

    if (!ProviderClass) {
      throw new Error(`No provider registered for ${config.provider}. Please ensure the provider is registered before use.`);
    }

    try {
      return new ProviderClass(config);
    } catch (error) {
      throw new Error(`Failed to initialize provider ${config.provider}: ${error}`);
    }
  }

  static listProviders(): string[] {
    return Array.from(providers.keys());
  }
}

// Initialize the LLM system
export async function initializeLLM() {
  if (isInitialized) {
    return;
  }

  try {
    // Dynamically import all provider modules
    const modules = await Promise.all([
      import('./providers/openai').then(module => module.OpenAIProvider),
      // Add other provider imports as needed
    ]);

    // Register the imported providers
    modules.forEach((ProviderClass, index) => {
      const providerNames = ['openai']; // Add other provider names as needed
      if (ProviderClass) {
        registerLLMProvider(providerNames[index], ProviderClass);
        console.log(`Registered provider: ${providerNames[index]}`);
      }
    });

    // Create the default provider instance
    defaultProviderInstance = LLMFactory.createProvider();

    isInitialized = true;
    console.log('LLM system initialized with providers:', LLMFactory.listProviders());
  } catch (error) {
    console.error('Failed to initialize LLM system:', error);
    throw error;
  }
}

// Export a getter for the default provider that ensures initialization
export function getDefaultProvider(): ILLMProvider {
  if (!isInitialized) {
    throw new Error('LLM system not initialized. Call initializeLLM() first.');
  }
  if (!defaultProviderInstance) {
    defaultProviderInstance = LLMFactory.createProvider();
  }
  return defaultProviderInstance;
}