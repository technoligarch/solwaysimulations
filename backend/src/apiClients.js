import OpenAI from 'openai';
import Anthropic from 'anthropic';
import { GoogleGenerativeAI } from '@google/generative-ai';

export function loadApiClients() {
  const clients = {};

  // Load OpenAI
  if (process.env.OPENAI_API_KEY) {
    clients.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  // Load Anthropic
  if (process.env.ANTHROPIC_API_KEY) {
    clients.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  // Load Google
  if (process.env.GOOGLE_API_KEY) {
    clients.google = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  }

  return clients;
}

export function validateApiKeys(apiKeys) {
  const validated = {};

  if (apiKeys.openai) {
    validated.openai = new OpenAI({ apiKey: apiKeys.openai });
  }
  if (apiKeys.anthropic) {
    validated.anthropic = new Anthropic({ apiKey: apiKeys.anthropic });
  }
  if (apiKeys.google) {
    validated.google = new GoogleGenerativeAI(apiKeys.google);
  }

  return validated;
}
