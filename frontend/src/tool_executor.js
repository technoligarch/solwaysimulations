import { tavily } from '@tavily/core';

const tools = {
  web_search: {
    definition: {
      type: 'function',
      function: {
        name: 'web_search',
        description: 'Search the web for current information, news, or facts.',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The search query to execute',
            },
          },
          required: ['query'],
        },
      },
    },
    execute: async ({ query }) => {
      try {
        if (!process.env.TAVILY_API_KEY) {
          return 'Error: TAVILY_API_KEY not configured on server.';
        }
        const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
        const result = await tvly.search(query, {
          search_depth: 'basic',
          max_results: 3,
        });
        
        return result.results
          .map((r) => `Title: ${r.title}\nContent: ${r.content}`)
          .join('\n\n');
      } catch (error) {
        console.error('Search tool error:', error);
        return `Error executing search: ${error.message}`;
      }
    },
  },
};

export const toolbox = tools;