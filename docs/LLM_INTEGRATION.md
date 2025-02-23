# LLM Integration Guide

This guide explains how to integrate new Language Learning Model (LLM) providers into ExamGuru.

## Architecture Overview

The LLM integration system is designed to be modular and provider-agnostic, allowing easy addition of new providers while maintaining consistent behavior across the application.

### Key Components

- **Provider Interface** (`server/llm/types.ts`): Defines the common interface all providers must implement
- **Provider Factory** (`server/llm/factory.ts`): Manages provider registration and instantiation
- **Configuration System** (`server/llm/config.ts`): Handles provider-specific configuration loading
- **Provider Implementations** (`server/llm/providers/`): Individual provider implementations

## Adding a New Provider

### 1. Create Provider Implementation

Create a new file in `server/llm/providers/<provider-name>.ts`:

```typescript
import { ILLMProvider, CompletionRequest, CompletionResponse, ImageGenerationRequest, ImageGenerationResponse, LLMConfig } from "../types";

export class NewProvider implements ILLMProvider {
  private client: any;
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
    this.client = // Initialize your provider's client
  }

  async generateCompletion(request: CompletionRequest): Promise<CompletionResponse> {
    // Implement completion generation
    // Make sure to handle system prompts from config
    const systemPrompt = this.getSystemPrompt(request.context);
    
    // Your provider-specific implementation
    const response = await this.client.complete({
      // Map our generic request to provider-specific format
    });

    return {
      content: response.text,
      // Map other response fields
    };
  }

  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    // Implement image generation if supported
    // or throw new Error("Image generation not supported");
  }

  private getSystemPrompt(context?: string): string | undefined {
    if (!this.config.systemPrompts) return undefined;
    if (!context) return this.config.systemPrompts.default;
    return this.config.systemPrompts[context as keyof typeof this.config.systemPrompts] 
           || this.config.systemPrompts.custom?.[context];
  }
}
```

### 2. Create Configuration File

Create `config/llm/<provider-name>.json`:

```json
{
  "modelName": "default-model",
  "apiEndpoint": "https://api.provider.com/v1",
  "options": {
    "temperature": 0.7,
    "maxTokens": 2000
  },
  "systemPrompts": {
    "default": "Default system prompt",
    "questionGeneration": "Question generation prompt",
    // Add other context-specific prompts
  }
}
```

### 3. Register the Provider

In `server/llm/factory.ts`, add your provider to the initialization:

```typescript
const modules = await Promise.all([
  import('./providers/openai').then(module => module.OpenAIProvider),
  import('./providers/new-provider').then(module => module.NewProvider),
  // Add other providers
]);

// Register the imported providers
modules.forEach((ProviderClass, index) => {
  const providerNames = ['openai', 'new-provider']; // Add your provider name
  if (ProviderClass) {
    registerLLMProvider(providerNames[index], ProviderClass);
  }
});
```

## Provider Requirements

### Required Capabilities

1. **Text Generation**: Must implement `generateCompletion`
2. **System Prompts**: Must support context-specific system prompts
3. **Error Handling**: Must properly handle and translate provider-specific errors

### Optional Capabilities

1. **Image Generation**: Implement `generateImage` if supported
2. **Streaming**: Support for streaming responses (future feature)
3. **Custom Options**: Support for provider-specific options

## Testing New Providers

1. Create test configuration in `config/llm/test-<provider>.json`
2. Add provider-specific tests in `tests/llm/providers/`
3. Test all standard use cases:
   - Question generation
   - Answer evaluation
   - Tutoring responses
   - Performance analysis

## Best Practices

1. **Error Handling**: Translate provider-specific errors to our standard error format
2. **Configuration**: Use reasonable defaults for optional configuration
3. **Validation**: Validate all inputs before sending to provider
4. **Logging**: Include appropriate logging for debugging
5. **Documentation**: Document provider-specific features and limitations

## Troubleshooting

Common issues and solutions:

1. **Configuration Loading**: Ensure JSON config is valid
2. **API Authentication**: Verify API keys and endpoints
3. **Response Format**: Ensure response mapping matches expected format
4. **System Prompts**: Verify prompt configuration for all contexts
