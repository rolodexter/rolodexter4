import { PrismaClient } from '@prisma/client';
import { createClient } from '@vercel/postgres';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prismaClientOptions = {
  datasources: {
    db: {
      url: process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL
    }
  },
  log: ['error', 'warn'],
  errorFormat: 'minimal',
};

async function connectWithRetry(client: PrismaClient, maxRetries = 5): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await client.$connect();
      console.log('Successfully connected to database');
      return true;
    } catch (error) {
      if (i === maxRetries - 1) {
        console.error('Failed to connect to database after', maxRetries, 'attempts:', error);
        throw error;
      }
      console.warn(`Connection attempt ${i + 1} failed, retrying in ${Math.pow(2, i)}s...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
  return false;
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient(prismaClientOptions);

// Initialize connection
connectWithRetry(prisma).catch(console.error);

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Vercel Postgres client for raw SQL operations
export const sql = createClient({
  connectionString: process.env.POSTGRES_URL,
  ssl: process.env.POSTGRES_SSL === 'true'
});

process.on('beforeExit', async () => {
  await prisma.$disconnect();
  await sql.end();
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

export async function testDatabaseConnection() {
  try {
    // Test Prisma connection
    await prisma.$queryRaw`SELECT 1`;
    console.log('Prisma connection successful');

    // Test Vercel Postgres connection
    await sql.query('SELECT 1');
    console.log('Vercel Postgres connection successful');

    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

export default prisma;