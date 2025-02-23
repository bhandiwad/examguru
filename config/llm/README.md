# LLM Provider Configuration

This directory contains configuration files for different LLM providers. Each provider should have its own JSON configuration file named `[provider-name].json`.

## Adding a New Provider

1. Create a new configuration file `[provider-name].json`
2. Create a provider implementation in `server/llm/providers/[provider-name].ts`
3. Register the provider using `registerLLMProvider`

## Configuration Structure

Each provider configuration file should follow this structure:
```json
{
  "modelName": "default model name",
  "apiEndpoint": "optional API endpoint",
  "options": {
    // Provider-specific options
    "temperature": 0.7,
    "maxTokens": 2000,
    // Add any other provider-specific options
  }
}
```

## Environment Variables

You can override configuration values using environment variables:
- `LLM_PROVIDER`: Provider name
- `LLM_API_KEY`: API key
- `LLM_API_ENDPOINT`: API endpoint
- `LLM_MODEL_NAME`: Model name
- `LLM_TEMPERATURE`: Temperature value
- `LLM_MAX_TOKENS`: Maximum tokens

Environment variables take precedence over configuration file values.
