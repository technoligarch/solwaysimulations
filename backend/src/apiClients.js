import OpenAI from 'openai';

export function loadApiClients() {
  if (!process.env.OPENROUTER_API_KEY) {
    console.warn('Warning: OPENROUTER_API_KEY not set. OpenRouter LLM calls will fail.');
  }

  // Use placeholder key to prevent SDK from crashing on init
  // Actual API calls will fail with auth error if key is missing
  const client = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY || 'missing-key',
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': 'https://github.com/technoligarch/solwaysimulations',
    },
  });

  return { openrouter: client };
}

export function validateApiKeys(apiKeys) {
  if (!apiKeys.openrouter) {
    throw new Error('OpenRouter API key is required');
  }

  return {
    openrouter: new OpenAI({
      apiKey: apiKeys.openrouter,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'https://github.com/technoligarch/solwaysimulations',
      },
    }),
  };
}
