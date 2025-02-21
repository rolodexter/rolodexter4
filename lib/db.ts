import { PrismaClient, Document, Prisma } from '@prisma/client';
import { Pool } from '@neondatabase/serverless';

// Log environment variables (without sensitive info)
console.log('Environment variables:', {
  POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL ? '[SET]' : '[NOT SET]',
  POSTGRES_URL_NON_POOLING: process.env.POSTGRES_URL_NON_POOLING ? '[SET]' : '[NOT SET]',
  DATABASE_URL: process.env.DATABASE_URL ? '[SET]' : '[NOT SET]',
  NODE_ENV: process.env.NODE_ENV
});

// Initialize Prisma client with direct database URL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL
    }
  },
  errorFormat: 'minimal',
  log: ['error', 'warn', 'info', 'query']
});

// Log the database URL being used (without sensitive info)
const dbUrl = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL || '';
console.log('Database URL pattern:', dbUrl.replace(/\/\/.*@/, '//****:****@'));

// Attempt to connect and catch any errors to prevent crashing
prisma.$connect()
  .then(() => {
    console.log('Successfully connected to the database');
  })
  .catch(e => {
    console.error('Postgres connection error:', {
      message: e.message,
      code: e.code,
      clientVersion: e.clientVersion,
      meta: e.meta
    });
  });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export { prisma };

// Add global type for Prisma
declare global {
  var prisma: PrismaClient | undefined;
}

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  path: string;
  type: string;
  metadata: {
    excerpt: string;
    rank: number;
  };
  created_at: string;
  updated_at: string;
}

/**
 * Test database connection
 */
export async function testConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

/**
 * Search for documents based on a query string.
 * Uses full-text search and relevance ranking.
 */
export async function searchDocuments(query: string): Promise<SearchResult[]> {
  try {
    console.log('Starting search with query:', query);

    // First, check if we have any documents at all
    const totalDocs = await prisma.document.count();
    console.log('Total documents in database:', totalDocs);

    // Create search conditions
    const searchConditions = createSearchConditions(query);
    console.log('Search conditions:', JSON.stringify(searchConditions, null, 2));

    // Execute search query
    const results = await prisma.document.findMany({
      where: searchConditions,
      orderBy: {
        updated_at: 'desc'
      },
      take: 20,
      select: {
        id: true,
        title: true,
        content: true,
        path: true,
        type: true,
        created_at: true,
        updated_at: true
      }
    });

    console.log('Raw results:', results);

    // Format results with proper type handling
    const formattedResults: SearchResult[] = results.map(doc => ({
      id: doc.id,
      title: doc.title,
      content: doc.content,
      path: doc.path,
      type: doc.type,
      created_at: doc.created_at.toISOString(),
      updated_at: doc.updated_at.toISOString(),
      metadata: {
        excerpt: doc.content?.substring(0, 200) || '',
        rank: 1
      }
    }));

    console.log('Total results:', formattedResults.length);
    return formattedResults;

  } catch (error) {
    console.error('Search failed:', error);
    throw error;
  }
}

/**
 * Create search conditions for the query
 */
function createSearchConditions(query: string): Prisma.DocumentWhereInput {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  
  return {
    OR: words.map(word => ({
      OR: [
        { title: { contains: word, mode: 'insensitive' } },
        { content: { contains: word, mode: 'insensitive' } },
        { path: { contains: word, mode: 'insensitive' } }
      ]
    }))
  };
}