import { createClient } from '@vercel/postgres';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: join(process.cwd(), '.env.local') });

// Validate required environment variables
const requiredEnvVars = [
  'POSTGRES_PRISMA_URL',
  'POSTGRES_URL',
  'POSTGRES_URL_NON_POOLING'
] as const;

async function verifyVercelPostgres() {
  console.log('Verifying Vercel Postgres configuration...\n');

  // Check environment variables
  console.log('Checking environment variables:');
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.error(`❌ Missing ${envVar}`);
      process.exit(1);
    }
    console.log(`✓ ${envVar} is set`);
    // Debug: Show URL structure (hiding credentials)
    const url = new URL(process.env[envVar]);
    console.log(`  ${envVar} host: ${url.hostname}`);
    console.log(`  ${envVar} pathname: ${url.pathname}`);
    console.log(`  ${envVar} protocol: ${url.protocol}`);
  }

  // Test Vercel Postgres connection
  console.log('\nTesting Vercel Postgres connection...');
  const sql = createClient({
    connectionString: process.env.POSTGRES_URL,
    ssl: true
  });

  try {
    console.log('Testing direct SQL connection...');
    console.log('Attempting to connect...');
    const result = await sql.query('SELECT version()');
    console.log('✓ Vercel Postgres SQL connection successful');
    console.log('Version:', result.rows[0].version);
  } catch (error) {
    console.error('❌ Vercel Postgres SQL connection failed');
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    process.exit(1);
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

  console.log('\n✅ All Vercel Postgres connections successful!');
}

// Add process error handling
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  process.exit(1);
});

verifyVercelPostgres().catch(error => {
  console.error('Verification failed:', error);
  process.exit(1);
}); 