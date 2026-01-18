import OpenAI from 'openai';

export function loadApiClients() {
  if (!process.env.OPENROUTER_API_KEY) {
    console.warn('Warning: OPENROUTER_API_KEY not set. LLM calls will fail.');
  }

  const client = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
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
