import { TavilyClient } from 'tavily-js';

let tavilyClient = null;

function initTavilyClient() {
  if (!tavilyClient && process.env.TAVILY_API_KEY) {
    tavilyClient = new TavilyClient({ apiKey: process.env.TAVILY_API_KEY });
  }
  return tavilyClient;
}

export async function search(query) {
  const client = initTavilyClient();
  if (!client) {
    return { error: 'Tavily API key not configured. Search tool unavailable.' };
  }

  try {
    const response = await client.search(query, {
      include_answer: true,
      max_results: 5,
    });

    if (response.answer) {
      return {
        answer: response.answer,
        results: response.results.map(r => ({
          title: r.title,
          url: r.url,
          snippet: r.snippet,
        })),
      };
    }

    return {
      results: response.results.map(r => ({
        title: r.title,
        url: r.url,
        snippet: r.snippet,
      })),
    };
  } catch (error) {
    console.error('Tavily search error:', error);
    return { error: `Search failed: ${error.message}` };
  }
}

export const toolbox = {
  search,
};
