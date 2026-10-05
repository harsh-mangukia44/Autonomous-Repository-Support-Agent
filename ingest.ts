import { MongoClient } from 'mongodb';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

// 1. ES Module __dirname fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 2. Configuration
const MONGO_URI = process.env.MONGO_URI || "your_mongodb_connection_string";
const REPO_PATH = path.join(__dirname, 'src');

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch('http://localhost:11434/api/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'nomic-embed-text', prompt: text })
  });

  if (!response.ok) {
    throw new Error('Ollama local embedding failed. Is ollama service running?');
  }

  const data = await response.json();
  return data.embedding; 
}

async function processRepository() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    const db = client.db('agent_db');
    const collection = db.collection('codebase_context');

    // Wipe stale context from previous runs
    await collection.deleteMany({ "metadata.repository": "autonomous-repo-agent" });

    // 3. Read Files Recursively inside src/
    const files = fs.readdirSync(REPO_PATH, { recursive: true })
      .map(file => file.toString())
      .filter(file => file.endsWith('.ts'));

    // 4. Configure Text Splitter
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    for (const file of files) {
      const filePath = path.join(REPO_PATH, file);
      
      // Skip subdirectories returned by recursive readdirSync
      if (!fs.statSync(filePath).isFile()) continue;

      const content = fs.readFileSync(filePath, 'utf-8');
      const chunks = await splitter.createDocuments([content]);
      
      console.log(`Processing ${file} (${chunks.length} chunks)...`);

      // 5. Embed and Upload
      for (const [index, chunk] of chunks.entries()) {
        const embedding = await generateEmbedding(chunk.pageContent);
        
        await collection.insertOne({
          type: "file",
          reference_id: `${file}_chunk_${index}`,
          content: chunk.pageContent,
          embedding: embedding,
          metadata: {
            repository: "autonomous-repo-agent",
            language: "typescript",
            file_path: file,
            status: "active",
            last_updated: new Date()
          }
        });
      }
    }
    
    console.log("Successfully ingested codebase into MongoDB Atlas!");
    
  } catch (error) {
    console.error("Ingestion failed:", error);
  } finally {
    await client.close();
  }
}

processRepository();