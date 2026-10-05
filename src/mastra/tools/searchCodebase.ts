import { createTool } from '@mastra/core/tools';;
import { z } from 'zod';
import { MongoClient } from 'mongodb';
import 'dotenv/config';

export const searchCodebase = createTool({
  id: 'search-codebase',
  title: 'Search Codebase',
  description: 'Searches the MongoDB vector database for relevant code snippets or documentation to help debug an issue.',
  inputSchema: z.object({
    query: z.string().describe('The search query or error message to look up in the codebase.'),
  }),
    execute: async (data: any) => {
      const query = data.query;
    
    // 1. Generate an embedding for the agent's search query
    // (Ensure this matches the embedding API you used in ingest.ts)
    const embedResponse = await fetch('http://localhost:11434/api/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'nomic-embed-text', prompt: query })
    });
    const embedData = await embedResponse.json();
    const queryVector = embedData.embedding;

    // 2. Connect to MongoDB Atlas
    const client = new MongoClient(process.env.MONGO_URI as string);
    await client.connect();
    const collection = client.db('agent_db').collection('codebase_context');

    // 3. Run the Vector Search aggregation
    const results = await collection.aggregate([
      {
        $vectorSearch: {
          index: 'code_vector_index',
          path: 'embedding',
          queryVector: queryVector,
          numCandidates: 100,
          limit: 3 // Return the top 3 most relevant code chunks
        }
      },
      {
        $project: {
          _id: 0,
          reference_id: 1,
          content: 1,
          score: { $meta: 'vectorSearchScore' } // Helps you debug search accuracy
        }
      }
    ]).toArray();

    await client.close();
    
    // 4. Return the code back to the Mastra agent
    return results;
  }
});