import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: join(process.cwd(), '.env.local') });

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'POSTGRES_PRISMA_URL',
  'POSTGRES_URL_NON_POOLING'
] as const;

function maskPassword(url: string): string {
  try {
    const urlObj = new URL(url);
    const maskedUrl = new URL(url);
    maskedUrl.password = '****';
    return maskedUrl.toString();
  } catch (e) {
    return 'Invalid URL format';
  }
}

async function verifyVercelPostgres() {
  console.log('Verifying Neon Postgres configuration...\n');

  // Check environment variables
  console.log('Checking environment variables:');
  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    if (!value) {
      console.error(`❌ Missing ${envVar}`);
      process.exit(1);
    }
    console.log(`✓ ${envVar} is set`);
    try {
      const url = new URL(value);
      console.log(`  ${envVar}:`);
      console.log(`    Protocol: ${url.protocol}`);
      console.log(`    Host: ${url.hostname}`);
      console.log(`    Database: ${url.pathname.slice(1)}`);
      console.log(`    SSL Mode: ${url.searchParams.get('sslmode') || 'not specified'}`);
      if (url.protocol !== 'postgresql:') {
        console.warn(`    ⚠️ Warning: Protocol should be 'postgresql://' but got '${url.protocol}//'`);
      }
      if (!url.searchParams.has('sslmode')) {
        console.warn(`    ⚠️ Warning: No SSL mode specified, connection may fail`);
      }
    } catch (e) {
      console.error(`  ❌ Invalid URL format for ${envVar}`);
    }
  }

  // Test direct Postgres connection
  console.log('\nTesting direct Postgres connection...');
  const connectionString = process.env.POSTGRES_URL_NON_POOLING;
  
  if (!connectionString) {
    console.error('❌ POSTGRES_URL_NON_POOLING is not set');
    process.exit(1);
  }

  const client = new pg.Client({
    connectionString,
    ssl: {
      rejectUnauthorized: true,
      requestCert: true
    },
    connectionTimeoutMillis: 10000, // 10 second timeout
    query_timeout: 5000
  });

  try {
    console.log('Attempting direct SQL connection...');
    console.log('Using non-pooling connection URL with SSL...');
    await client.connect();
    const result = await client.query('SELECT version()');
    console.log('✓ Direct Postgres SQL connection successful');
    console.log('Version:', result.rows[0].version);
  } catch (error) {
    console.error('❌ Direct Postgres SQL connection failed');
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    process.exit(1);
  } finally {
    await client.end().catch(console.error);
  }

  // Test Prisma connection
  console.log('\nTesting Prisma connection...');
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.POSTGRES_PRISMA_URL
      }
    },
    log: ['query', 'info', 'warn', 'error']
  });

  try {
    console.log('Attempting Prisma connection...');
    console.log('Using Prisma connection URL with pgbouncer and SSL...');
    await prisma.$connect();
    console.log('Connection established, testing query...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✓ Prisma connection successful');
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Prisma connection failed');
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    process.exit(1);
  }

  console.log('\n✅ All database connections successful!');
}

// Add process error handling
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  process.exit(1);
});

// Add timeout for the entire process
const timeout = setTimeout(() => {
  console.error('Verification timed out after 30 seconds');
  process.exit(1);
}, 30000);

verifyVercelPostgres()
  .catch(error => {
    console.error('Verification failed:', error);
    process.exit(1);
  })
  .finally(() => {
    clearTimeout(timeout);
  }); 