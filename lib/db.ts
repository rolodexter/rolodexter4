import { PrismaClient } from '@prisma/client';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Configure Neon to use WebSocket only on the server side
if (typeof window === 'undefined') {
  neonConfig.webSocketConstructor = ws;
  // Configure secure connection settings
  neonConfig.useSecureWebSocket = "password"; // Use password authentication for WebSocket
  neonConfig.pipelineTLS = true; // Enable TLS pipeline
}

// Log environment variables (without sensitive info)
console.log('Environment variables:', {
  POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL ? '[SET]' : '[NOT SET]',
  POSTGRES_URL_NON_POOLING: process.env.POSTGRES_URL_NON_POOLING ? '[SET]' : '[NOT SET]',
  DATABASE_URL: process.env.DATABASE_URL ? '[SET]' : '[NOT SET]',
  NODE_ENV: process.env.NODE_ENV
});

// Ensure database URL has the correct format for Neon
function formatDatabaseUrl(url: string): string {
  if (!url) return url;
  
  // Convert to WebSocket protocol if not already
  if (url.startsWith('postgres://')) {
    url = url.replace('postgres://', 'postgresql://');
  }

  // Add ?connect_timeout=10 if not present
  const hasTimeout = url.includes('connect_timeout=');
  const hasParams = url.includes('?');
  
  if (!hasTimeout) {
    if (hasParams) {
      url += '&connect_timeout=10';
    } else {
      url += '?connect_timeout=10';
    }
  }

  // Add @neondb suffix if using neon.tech and not already present
  if (url.includes('neon.tech') && !url.includes('@neondb')) {
    url = url.replace('.tech/', '.tech/neondb/');
  }

  // Add sslmode=require if not present
  if (!url.includes('sslmode=')) {
    url += url.includes('?') ? '&sslmode=require' : '?sslmode=require';
  }

  return url;
}

// Get the appropriate database URL
const dbUrl = formatDatabaseUrl(
  process.env.POSTGRES_URL_NON_POOLING || 
  process.env.DATABASE_URL || 
  ''
);

// Set POSTGRES_PRISMA_URL if not set
if (!process.env.POSTGRES_PRISMA_URL && dbUrl) {
  process.env.POSTGRES_PRISMA_URL = dbUrl;
}

// Log the database URL being used (without sensitive info)
console.log('Database URL pattern:', dbUrl.replace(/\/\/.*@/, '//****:****@'));

// Create a connection pool with Neon-specific settings
const pool = new Pool({ 
  connectionString: dbUrl,
  max: 1,
  ssl: {
    rejectUnauthorized: true
  },
  connectionTimeoutMillis: 10000
});

// Initialize Prisma client with pooled connection URL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.POSTGRES_PRISMA_URL || dbUrl
    }
  },
  errorFormat: 'minimal',
  log: ['error', 'warn', 'info', 'query']
});

// Add global type for Prisma
declare global {
  var prisma: PrismaClient | undefined;
  var pool: Pool | undefined;
}

// Add to globals in development
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
  global.pool = pool;
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

export { prisma, pool };