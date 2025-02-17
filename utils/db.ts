/**
 * Database Utility Module
 * 
 * Provides centralized database access and utility functions.
 * Handles both Prisma and Vercel Postgres connections.
 * 
 * Related Tasks:
 * - Database Migration: agents/rolodexterVS/tasks/active-tasks/database-migration.html
 * - Vercel Blob Integration: agents/rolodexterVS/tasks/active-tasks/vercel-blob-integration.html
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { createPool } from '@vercel/postgres';

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'DATABASE_URL_UNPOOLED'
] as const;

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// Ensure URL has required parameters
function ensureValidConnectionUrl(url: string): string {
  const urlObj = new URL(url);
  if (!urlObj.searchParams.has('sslmode')) {
    urlObj.searchParams.append('sslmode', 'require');
  }
  return urlObj.toString();
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Environment-specific configuration
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Ensure proper URL configuration
const prismaUrl = ensureValidConnectionUrl(process.env.DATABASE_URL!);

// Initialize Prisma client with environment-specific settings
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: prismaUrl
    }
  },
  log: isDevelopment ? ['query', 'error', 'warn'] : ['error', 'warn']
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Initialize Vercel Postgres pool
export const sql = createPool({
  connectionString: prismaUrl,
  ssl: true,
  max: 10
});

// Test database connection
export async function testDatabaseConnection() {
  try {
    // Test Prisma connection
    await prisma.$queryRaw`SELECT 1`;
    console.log('✓ Prisma connection successful');

    // Test Vercel Postgres connection
    const pool = sql;
    await pool.query('SELECT 1');
    console.log('✓ Vercel Postgres connection successful');

    return true;
  } catch (error: unknown) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

// Initialize connection with environment logging
console.log(`Database initialized in ${process.env.NODE_ENV} environment`);

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
export async function searchDocuments(query: string): Promise<Document[]> {
  try {
    return await (prisma as any).document.findMany({
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

// Create or update a document
export async function upsertDocument(doc: {
  title: string;
  content: string;
  path: string;
  type: string;
  metadata?: any;
}): Promise<Document> {
  try {
    return await (prisma as any).document.upsert({
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

export default prisma;