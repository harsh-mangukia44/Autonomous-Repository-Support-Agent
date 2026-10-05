import { Connection, Client } from '@temporalio/client';
import { agentWorkflow } from './workflows/workflow.js';
import 'dotenv/config';

async function run() {
  // Connect to the local Temporal server
  const connection = await Connection.connect();
  
  const client = new Client({
    connection,
  });
  const issueDescription = "I'm getting a 'cannot read properties of undefined (reading map)' error when the SerpApi tool returns results. Skip the searchCodebase tool. Immediately use the webSearch tool to look up the 'SerpApi Google Search JSON response format' and write the exact TypeScript code fix.";
  console.log(`Submitting Issue to Agent: ${issueDescription}`);

  // Start the workflow
  const handle = await client.workflow.start(agentWorkflow, {
    args: [issueDescription],
    taskQueue: 'agent-tasks',
    // Give this specific run a unique ID
    workflowId: 'github-issue-debug-006', 
  });

  console.log(`Started workflow ${handle.workflowId}. Waiting for agent to finish...`);

  // Wait for the agent to finish its thinking, tool calling, and code writing
  const result = await handle.result();
  
  console.log('\n=== AGENT RESPONSE ===\n');
  console.log(result);
  console.log('\n======================\n');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});