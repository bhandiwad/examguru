import { LLMConfig, ILLMProvider } from "./types";
import { loadConfig } from "./config";

// Provider class registry
const providerRegistry = new Map<string, new (config: LLMConfig) => ILLMProvider>();

// Keep track of initialization state
let isInitialized = false;
let defaultProviderInstance: ILLMProvider | null = null;

export function registerLLMProvider(
  providerName: string,
  providerClass: new (config: LLMConfig) => ILLMProvider
) {
  providerRegistry.set(providerName, providerClass);
}

export class LLMFactory {
  static createProvider(config: LLMConfig = loadConfig()): ILLMProvider {
    const ProviderClass = providerRegistry.get(config.provider);

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
    return Array.from(providerRegistry.keys());
  }
}

// Initialize the LLM system
export async function initializeLLM() {
  if (isInitialized) {
    return;
  }

  // Import and register all providers
  await Promise.all([
    import('./providers/openai').then(module => {
      // Provider registration happens in the module
      console.log('OpenAI provider registered');
    }),
    // Add other provider imports here as needed
  ]);

  // Create the default provider instance
  defaultProviderInstance = LLMFactory.createProvider();

  isInitialized = true;
  console.log('LLM system initialized with providers:', LLMFactory.listProviders());
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

// Import providers here to register them
import "./providers/openai";