import { createTool } from '@mastra/core/tools';;
import { z } from 'zod';

export const webSearch = createTool({
  id: 'web-search',
  title: 'Web Search',
  description: 'Searches the live internet for up-to-date documentation, Stack Overflow answers, or API references.',
  inputSchema: z.object({
    query: z.string().describe('The specific technical question or error message to search for.'),
  }),
  execute: async (data: any) => {
    const query = data.query;
    const apiKey = process.env.SERPAPI_API_KEY;

    if (!apiKey) {
      throw new Error('SERPAPI_API_KEY is missing from environment variables.');
    }

    // Call the SerpApi Google Search endpoint
    const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&api_key=${apiKey}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();

      // Extract the top 3 organic search results to feed back to Gemma
      const organicResults = data.organic_results?.slice(0, 3).map((result: any) => ({
        title: result.title,
        link: result.link,
        snippet: result.snippet,
      })) || [];

      return {
        success: true,
        results: organicResults
      };
    } catch (error) {
      console.error("SerpApi search failed:", error);
      return { success: false, error: "Failed to fetch search results." };
    }
  }
});