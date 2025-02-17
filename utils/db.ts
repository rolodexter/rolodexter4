import { PrismaClient } from '@prisma/client';
import { createClient } from '@vercel/postgres';
import type { Document, Memory, Task, Reference, Tag } from '@prisma/client';

// Initialize Prisma Client
const prisma = new PrismaClient();

// Initialize Vercel Postgres Client for raw SQL operations
const sql = createClient({
  connectionString: process.env.POSTGRES_URL
});

export interface Document {
  id: string;
  title: string;
  content: string;
  path: string;
  created_at: Date;
  updated_at: Date;
}

// Initialize the database with required tables
export async function initializeDatabase() {
  try {
    await sql.connect();
    
    // Create full-text search index
    await sql.sql`
      CREATE EXTENSION IF NOT EXISTS pg_trgm;
      CREATE EXTENSION IF NOT EXISTS vector;
      
      -- Ensure documents table has tsvector column
      ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS ts_document tsvector
      GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(content, '')), 'B')
      ) STORED;

      -- Create GiST index for full-text search
      CREATE INDEX IF NOT EXISTS idx_documents_ts ON "Document" USING GIN (ts_document);
      
      -- Create index for vector similarity search
      CREATE INDEX IF NOT EXISTS idx_memories_embedding ON "Memory" USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100);
    `;
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Search documents with full-text search
export async function searchDocuments(query: string) {
  try {
    return await prisma.Document.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } }
        ]
      },
      include: {
        tags: true,
        references: {
          include: {
            target: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 10
    });
  } catch (error) {
    console.error('Search failed:', error);
    throw error;
  }
}

// Vector similarity search for memories
export async function searchSimilarMemories(embedding: Float64Array, threshold: number = 0.8) {
  try {
    await sql.connect();
    const result = await sql.sql`
      SELECT id, type, content, metadata,
             1 - (embedding <=> ${Buffer.from(embedding.buffer)}::vector) as similarity
      FROM "Memory"
      WHERE 1 - (embedding <=> ${Buffer.from(embedding.buffer)}::vector) > ${threshold}
      ORDER BY similarity DESC
      LIMIT 10;
    `;
    return result.rows;
  } catch (error) {
    console.error('Similarity search failed:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Create or update a document
export async function upsertDocument(doc: {
  title: string;
  content: string;
  path: string;
  type: string;
  metadata?: any;
}) {
  try {
    return await prisma.Document.upsert({
      where: { path: doc.path },
      update: {
        title: doc.title,
        content: doc.content,
        type: doc.type,
        metadata: doc.metadata || {},
        updated_at: new Date()
      },
      create: {
        title: doc.title,
        content: doc.content,
        path: doc.path,
        type: doc.type,
        metadata: doc.metadata || {}
      }
    });
  } catch (error) {
    console.error('Failed to upsert document:', error);
    throw error;
  }
}

// Test database connection
export async function testConnection() {
  try {
    await sql.connect();
    await sql.sql`SELECT 1`;
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  } finally {
    await sql.end();
  }
}

export { prisma, sql }; 