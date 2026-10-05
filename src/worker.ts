import 'dotenv/config';
// Sentry must be initialized before other imports
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

Sentry.init({
  dsn: "https://427b881abba8d7e0d6c3fe99ccd51380@o4512200032583680.ingest.de.sentry.io/4512200064041040", // Replace with your actual DSN from the Sentry dashboard
  integrations: [
    nodeProfilingIntegration(),
  ],
  // We sample 100% of traces for the hackathon to guarantee our AI runs show up in the dashboard
  tracesSampleRate: 1.0, 
  profileSessionSampleRate: 1.0,
});

import { Worker } from '@temporalio/worker';
import * as activities from './workflows/activities.js';
import { fileURLToPath } from 'url';
import * as path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  const worker = await Worker.create({
    workflowsPath: path.join(__dirname, 'workflows/workflow.ts'),
    activities,
    taskQueue: 'agent-tasks',
  });

  console.log('Worker is running with Sentry Tracing enabled...');
  await worker.run();
}

run().catch((err) => {
  Sentry.captureException(err); // Capture fatal worker crashes
  console.error(err);
  process.exit(1);
});