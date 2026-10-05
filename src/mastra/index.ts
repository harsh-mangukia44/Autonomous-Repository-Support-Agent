import { Mastra } from '@mastra/core';
import { Agent } from '@mastra/core/agent';
import { searchCodebase } from './tools/searchCodebase.js';
import { webSearch } from './tools/webSearch.js';
import { createOpenAI } from '@ai-sdk/openai';
import 'dotenv/config';

// Configure the OpenRouter provider
const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
});

export const techSupportAgent = new Agent({
  id: 'tech-support-agent',
  name: 'Repo Fixer',
  instructions: `You are an autonomous tech support agent. You analyze GitHub issues, search the codebase context to find the bug, and write fixes. 
  Step 1: Always use the searchCodebase tool to understand the local repository context.
  Step 2: If the issue involves an external library, an unknown error, or you need more context, use the webSearch tool.
  Step 3: Propose the code fix.`,
  // Pass the free Gemma model through OpenRouter
// Try the 27B or 12B Gemma 3 model instead
  // Automatically routes to any available free model
  // Uses the robust 9B model which supports tools and is less congested
  model: openrouter('qwen/qwen3.8-27b:free'),
  tools: { searchCodebase, webSearch } 
});

export const mastra = new Mastra({
  agents: { techSupportAgent },
});