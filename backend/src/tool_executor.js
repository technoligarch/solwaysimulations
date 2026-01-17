import { tavily } from '@tavily/core';

// Lazy-initialize the Tavily client (created on first use, not at module load)
// This ensures dotenv has loaded the environment variables first
let tavilyClient = null;

function getTavilyClient() {
  if (!tavilyClient) {
    tavilyClient = tavily({
      apiKey: process.env.TAVILY_API_KEY,
    });
  }
  return tavilyClient;
}

/**
 * A tool that searches the internet for a given query using Tavily.
 */
export async function search(query) {
  if (!query) {
    return 'Error: No search query provided.';
  }

  console.log(`[Toolbox] TOOL CALLED: search() with query: "${query}"`);

  try {
    // We use the .search method as shown in the docs
    const searchResponse = await getTavilyClient().search(query, {
      searchDepth: 'basic',
      maxResults: 5,
    });

    // The docs show the response is the direct result, let's format it.
    // Tavily often includes an 'answer' for summarization.
    const conciseResult = searchResponse.answer || JSON.stringify(searchResponse.results);

    console.log(`[Toolbox] TOOL RESULT: ${conciseResult.substring(0, 100)}...`);
    return conciseResult;

  } catch (error) {
    console.error('[Toolbox] Error during Tavily search:', error);
    return `Error: Failed to perform search for "${query}".`;
  }
}
