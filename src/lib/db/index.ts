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

// Get the database URL with proper fallback order
const getDatabaseUrl = () => {
  // Log available environment variables (without sensitive values)
  console.log('Available database environment variables:', {
    DATABASE_URL: !!process.env.DATABASE_URL,
    POSTGRES_PRISMA_URL: !!process.env.POSTGRES_PRISMA_URL,
    NODE_ENV: process.env.NODE_ENV
  });

  // Prioritize Vercel's environment variables
  const url = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL;
  
  if (!url) {
    console.error('No database URL found in environment variables');
    throw new Error('Database URL not configured');
  }
  
  return url;
};

// Initialize Prisma Client with connection pooling
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: getDatabaseUrl()
    }
  },
  log: ['error', 'warn']
});

// Initialize Vercel Postgres Pool for raw SQL operations
const sql = createPool({
  connectionString: getDatabaseUrl()
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

interface SearchResult extends Omit<Document, 'created_at' | 'updated_at'> {
  created_at: string;
  updated_at: string;
  metadata: {
    excerpt: string;
    rank: number;
  };
}

// Initialize the database with required tables
export async function initializeDatabase() {
  try {
    // Create extensions for search
    await sql.query(`
      CREATE EXTENSION IF NOT EXISTS pg_trgm;
      CREATE EXTENSION IF NOT EXISTS vector;
      
      -- Create trigram index for better text search
      CREATE INDEX IF NOT EXISTS idx_documents_title_trgm ON "Document" USING GIN (title gin_trgm_ops);
      CREATE INDEX IF NOT EXISTS idx_documents_content_trgm ON "Document" USING GIN (content gin_trgm_ops);
      
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

// Convert Windows path to web URL path
function normalizeFilePath(path: string): string {
  // Remove the base directory path and ensure correct project path
  const basePath = 'C:\\rolodexter4\\';
  let normalizedPath = path;
  
  if (normalizedPath.startsWith(basePath)) {
    normalizedPath = normalizedPath.substring(basePath.length);
  }
  
  // Convert backslashes to forward slashes
  normalizedPath = normalizedPath.replace(/\\/g, '/');
  
  // Remove any leading slash
  normalizedPath = normalizedPath.replace(/^\//, '');

  // If the path doesn't start with 'projects/', add it
  if (!normalizedPath.startsWith('projects/')) {
    normalizedPath = `projects/${normalizedPath}`;
  }

  // Log the path transformation
  console.log('Path transformation:', {
    original: path,
    normalized: normalizedPath,
    final: `/${normalizedPath}`
  });
  
  // Add leading slash
  return `/${normalizedPath}`;
}

// Search documents with full-text search
export async function searchDocuments(query: string): Promise<SearchResult[]> {
  try {
    console.log('Starting search with query:', query);
    
    // First try using Prisma for the search
    const tasks = await prisma.task.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { filePath: { contains: query, mode: 'insensitive' } }
        ]
      },
      distinct: ['filePath'], // Prevent duplicates
      orderBy: { updated_at: 'desc' },
      take: 20
    });

    console.log('Found tasks:', tasks.length);

    const documents = await prisma.document.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
          { path: { contains: query, mode: 'insensitive' } }
        ]
      },
      distinct: ['path'], // Prevent duplicates
      orderBy: { updated_at: 'desc' },
      take: 20
    });

    console.log('Found documents:', documents.length);

    // Convert tasks to Document format
    const taskDocs = tasks.map(task => ({
      id: task.id,
      title: task.title,
      content: task.description || '',
      type: 'task',
      path: normalizeFilePath(task.filePath),
      created_at: new Date(task.created_at).toISOString(),
      updated_at: new Date(task.updated_at).toISOString(),
      metadata: {
        excerpt: extractExcerpt(task.description || '', query),
        rank: 1,
        status: task.status
      }
    }));

    // Format documents
    const formattedDocs = documents.map(doc => ({
      id: doc.id,
      title: doc.title,
      content: doc.content,
      type: doc.type,
      path: normalizeFilePath(doc.path),
      created_at: new Date(doc.created_at).toISOString(),
      updated_at: new Date(doc.updated_at).toISOString(),
      metadata: {
        excerpt: extractExcerpt(doc.content, query),
        rank: 1
      }
    }));

    // Combine and sort results, removing duplicates by path
    const results = [...taskDocs, ...formattedDocs]
      .filter((result, index, self) => 
        index === self.findIndex((r) => r.path === result.path)
      )
      .sort((a, b) => {
        // Sort by relevance (if title contains query, prioritize)
        const aTitle = a.title.toLowerCase().includes(query.toLowerCase());
        const bTitle = b.title.toLowerCase().includes(query.toLowerCase());
        if (aTitle && !bTitle) return -1;
        if (!aTitle && bTitle) return 1;
        
        // Then sort by date
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });

    console.log('Total results:', results.length);
    return results;

  } catch (error) {
    console.error('Search failed:', error);
    throw error;
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