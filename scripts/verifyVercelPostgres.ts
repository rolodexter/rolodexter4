import { PrismaClient } from '@prisma/client';
import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: join(process.cwd(), '.env.local') });

// The exact working connection string
const NEON_CONNECTION_STRING = "postgres://neondb_owner:npg_5CzhuMceAg3H@ep-purple-pine-a6s64w9x-pooler.us-west-2.aws.neon.tech/neondb?sslmode=require";

async function verifyVercelPostgres() {
  console.log('Verifying Neon Postgres configuration...\n');

  // Test direct Neon connection
  console.log('\nTesting direct Neon connection...');
  const sql = neon(NEON_CONNECTION_STRING);

  try {
    console.log('Attempting direct SQL connection...');
    console.log('Using pooled connection URL...');
    const result = await sql`SELECT version()`;
    console.log('✓ Direct Neon SQL connection successful');
    console.log('Version:', result[0].version);

    // Test a simple query
    console.log('\nTesting simple query...');
    const testResult = await sql`SELECT 1 as test`;
    console.log('✓ Query successful:', testResult[0]);
  } catch (error) {
    console.error('❌ Direct Neon SQL connection failed');
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
        url: NEON_CONNECTION_STRING
      }
    },
    log: ['query', 'info', 'warn', 'error']
  });

  try {
    console.log('Attempting Prisma connection...');
    console.log('Using connection URL...');
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