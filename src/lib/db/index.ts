/**
 * Database Module
 * 
 * This module provides centralized database access for the application.
 * It exports the Prisma client instance and utility functions for database operations.
 * 
 * Related Tasks:
 * - Vercel Blob Integration: agents/rolodexterVS/tasks/active-tasks/vercel-blob-integration.html
 * - Database Migration: agents/rolodexterVS/tasks/active-tasks/database-migration.html
 * - Search Enhancement: projects/rolodexter4/ui/tasks/active/search-results-enhancement.html
 * 
 * Implementation Details:
 * - Session Log (2025-02-18): agents/memories/session-logs/2025/02/18.html
 * 
 * Usage:
 * import { prisma } from '@db';  // Direct import of Prisma client
 * import { searchDocuments } from '@db';  // Import specific utilities
 */

import { PrismaClient } from '@prisma/client';
import { createPool } from '@vercel/postgres';

// Initialize Prisma Client with connection pooling
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL
    }
  }
});

// Initialize Vercel Postgres Pool for raw SQL operations
const sql = createPool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL
});

// Basic interfaces for our data types
export interface Tag {
  id: string;
  name: string;
  color: string | null;
}

export interface Reference {
  id: string;
  source_id: string;
  target_id: string;
  type: string;
  confidence: number;
  metadata: any;
}

export interface Document {
  id: string;
  title: string;
  content: string;
  path: string;
  type: string;
  metadata: any;
  created_at: Date;
  updated_at: Date;
  tags?: Tag[];
  references?: Reference[];
}

interface SearchRow extends Document {
  rank: number;
}

// Initialize the database with required tables
export async function initializeDatabase() {
  try {
    // Create full-text search index
    await sql.query(`
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
    `);
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

// Search documents with full-text search
export async function searchDocuments(query: string): Promise<Document[]> {
  try {
    // First try full-text search using ts_document
    const tsQuery = query.trim().replace(/\s+/g, ' & ');
    const { rows } = await sql.query(
      'SELECT d.*, ts_rank(ts_document, to_tsquery($1, $2)) as rank FROM "Document" d WHERE ts_document @@ to_tsquery($1, $2) ORDER BY rank DESC, created_at DESC LIMIT 10',
      ['english', tsQuery]
    );

    if (rows && rows.length > 0) {
      // Convert raw results to Document type
      return rows.map((row: SearchRow) => ({
        ...row,
        metadata: {
          ...row.metadata,
          rank: row.rank,
          excerpt: extractExcerpt(row.content, query)
        }
      }));
    }

    // Fallback to basic search if no full-text results
    return await prisma.document.findMany({
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
    // Fallback to basic search if full-text search fails
    return await prisma.document.findMany({
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
  }
}

// Helper function to extract relevant excerpt from content
function extractExcerpt(content: string, query: string): string {
  if (!content) return '';
  
  const words = query.toLowerCase().split(/\s+/);
  const contentLower = content.toLowerCase();
  let bestPosition = 0;
  let bestMatchCount = 0;

  // Find the best matching position in the content
  for (let i = 0; i < content.length; i++) {
    let matchCount = 0;
    words.forEach(word => {
      if (contentLower.slice(i).startsWith(word)) matchCount++;
    });
    if (matchCount > bestMatchCount) {
      bestMatchCount = matchCount;
      bestPosition = i;
    }
  }

  // Extract surrounding context (about 200 characters)
  const start = Math.max(0, bestPosition - 100);
  const end = Math.min(content.length, bestPosition + 100);
  let excerpt = content.slice(start, end);

  // Add ellipsis if needed
  if (start > 0) excerpt = '...' + excerpt;
  if (end < content.length) excerpt = excerpt + '...';

  return excerpt;
}

// Create or update a document
export async function upsertDocument(doc: {
  title: string;
  content: string;
  path: string;
  type: string;
  metadata?: any;
}): Promise<Document> {
  try {
    return await prisma.document.upsert({
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
    await sql.query('SELECT 1');
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

export { prisma, sql }; 