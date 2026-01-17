import { TavilyClient } from 'tavily-node';
import 'dotenv/config';

// Initialize the Tavily client with your API key from the .env file
const tavilyClient = new TavilyClient({
  apiKey: process.env.TAVILY_API_KEY,
});

/**
 * A tool that searches the internet for a given query using Tavily.
 * @param {string} query - The search query.
 * @returns {Promise<string>} A summary of the search results.
 */
export async function search(query) {
  if (!query) {
    return 'Error: No search query provided.';
  }

  console.log(`[Toolbox] TOOL CALLED: search() with query: "${query}"`);

  try {
    const searchResponse = await tavilyClient.search(query, {
      searchDepth: 'basic', // 'basic' is fast and cheap, 'advanced' is for deep research
      maxResults: 3, // We'll get 3 search results to summarize
    });

    // We will just return the main answer from Tavily for now, it's very clean.
    const conciseResult = searchResponse.answer || JSON.stringify(searchResponse.results);
    
    console.log(`[Toolbox] TOOL RESULT: ${conciseResult.substring(0, 100)}...`);
    return conciseResult;

  } catch (error) {
    console.error('[Toolbox] Error during Tavily search:', error);
    return `Error: Failed to perform search for "${query}".`;
  }
}
