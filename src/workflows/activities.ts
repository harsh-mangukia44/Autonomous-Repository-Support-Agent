import { techSupportAgent } from '../mastra/index.js';

// This activity calls our Mastra agent. 
// If this function throws an error (e.g., API timeout), Temporal will automatically retry it.
export async function runTechSupportAgent(issueDescription: string): Promise<string> {
  console.log(`Starting agent task for issue: "${issueDescription}"`);
  
  const response = await techSupportAgent.generate([
    { role: 'user', content: issueDescription }
  ], {
    // Give the agent up to 5 iterations to search, read, and write the final fix
    maxSteps: 5 
  });

  return response.text;
}