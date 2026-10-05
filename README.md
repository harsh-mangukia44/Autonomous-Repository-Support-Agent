# Autonomous Repository Support Agent

A TypeScript prototype that combines a Mastra AI agent, Temporal workflows, MongoDB Atlas Vector Search, Ollama embeddings, SerpApi web search, and Sentry monitoring. The agent is designed to investigate a technical issue using repository context and web search, then return a suggested fix.

## How it works

1. `ingest.ts` reads TypeScript files from `src/`, splits them into overlapping chunks, creates embeddings with the local Ollama `nomic-embed-text` model, and stores the chunks in MongoDB.
2. The `techSupportAgent` in `src/mastra/index.ts` can use:
   - **Search Codebase** to find relevant chunks in MongoDB Atlas Vector Search.
   - **Web Search** to retrieve current technical references through SerpApi.
3. `src/workflows/workflow.ts` defines a Temporal workflow that calls the agent activity. Temporal retries activity failures up to five times.
4. `src/worker.ts` starts the Temporal worker on the `agent-tasks` task queue and reports uncaught worker failures to Sentry.

## Requirements

- Node.js with npm
- A running Temporal server, reachable at `localhost:7233` unless configured otherwise
- MongoDB Atlas with a database and Vector Search index configured for the stored `embedding` field
- [Ollama](https://ollama.com/) running locally with the `nomic-embed-text` model available
- An OpenRouter API key for the agent model
- A SerpApi API key for web search
- A Sentry project DSN for worker error reporting

Pull the embedding model with Ollama before ingesting:

```sh
ollama pull nomic-embed-text
```

The MongoDB collection is `agent_db.codebase_context`. The vector search tool expects an Atlas Vector Search index named `code_vector_index` on the `embedding` field. Configure the index dimensions to match the embedding model's output.

## Configuration

Copy `.env.example` to `.env` and set the credentials:

```sh
cp .env.example .env
```

| Variable | Used for |
| --- | --- |
| `MONGO_URI` | MongoDB connection string, used by ingestion and codebase search |
| `OPENROUTER_API_KEY` | Access to the configured Qwen model through OpenRouter |
| `SERPAPI_API_KEY` | Live web search |

The worker currently initializes Sentry using a DSN configured in `src/worker.ts`; set it to the DSN for your own Sentry project before deploying. Never commit `.env` or real credentials.

## Install

```sh
npm install
```

## Ingest repository context

Ensure Ollama, MongoDB, and the required environment variables are available, then run:

```sh
npx tsx ingest.ts
```

Ingestion processes `.ts` files under `src/`, splits them into 1,000-character chunks with 200-character overlap, and stores an embedding for each chunk. **Each run first deletes existing documents whose repository metadata is `autonomous-repo-agent` from the target collection.** Review this behavior before running against a collection containing data you need to preserve.

## Start the Temporal worker

Start your Temporal server first, then run:

```sh
npx tsx src/worker.ts
```

The worker listens on the `agent-tasks` queue. If Temporal is not running or reachable at `localhost:7233`, worker startup fails with a connection-refused error. This project currently includes the workflow and worker, but does not include a Temporal client/command for starting a workflow execution.

## Type-check

```sh
npx tsc --noEmit
```

The package's `npm test` script is currently a placeholder and exits with an error; no test suite is configured yet.

## Project layout

```text
.
├── ingest.ts                       # Embed and index source files in MongoDB
├── src/
│   ├── mastra/
│   │   ├── index.ts                # Mastra agent and OpenRouter model
│   │   └── tools/
│   │       ├── searchCodebase.ts   # MongoDB vector search with Ollama embeddings
│   │       └── webSearch.ts        # SerpApi web search
│   ├── worker.ts                   # Temporal worker and Sentry initialization
│   └── workflows/
│       ├── activities.ts           # Calls the Mastra agent
│       └── workflow.ts             # Temporal workflow and retry policy
├── .env.example                    # Environment variable template
├── package.json
└── tsconfig.json
```
