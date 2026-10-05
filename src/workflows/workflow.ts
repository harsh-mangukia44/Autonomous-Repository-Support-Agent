import { proxyActivities } from '@temporalio/workflow';
// Import the type of our activities, not the implementation
import type * as activities from './activities.js';

// Set up the rules for how the activity should be executed
const { runTechSupportAgent } = proxyActivities<typeof activities>({
  startToCloseTimeout: '5 minutes', // Give Gemma and SerpApi plenty of time
  retry: {
    initialInterval: '10 seconds',
    backoffCoefficient: 2,
    maximumAttempts: 5, // Retry up to 5 times if an API fails
  },
});

export async function agentWorkflow(issueDescription: string): Promise<string> {
  // Execute the activity. If it fails, Temporal handles the retries automatically.
  const result = await runTechSupportAgent(issueDescription);
  return result;
}