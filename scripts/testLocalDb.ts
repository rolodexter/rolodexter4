import { Pool } from 'pg';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: join(process.cwd(), '.env.local') });

interface PostgresError extends Error {
  code?: string;
  detail?: string;
  schema?: string;
  table?: string;
  column?: string;
  dataType?: string;
  constraint?: string;
}

async function testLocalDb() {
  console.log('🔍 Testing local database connections...\n');

  // Test direct PostgreSQL connection
  console.log('Testing direct PostgreSQL connection...');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false
  });

  try {
    const client = await pool.connect();
    console.log('✅ Direct PostgreSQL connection successful');
    
    // Test a query
    const result = await client.query('SELECT version()');
    console.log('PostgreSQL version:', result.rows[0].version);
    
    client.release();
    await pool.end();
  } catch (err) {
    const error = err as PostgresError;
    console.error('❌ Direct PostgreSQL connection failed:', error.message);
    process.exit(1);
  }

  // Test Prisma connection
  console.log('\nTesting Prisma connection...');
  const prisma = new PrismaClient();

  try {
    await prisma.$connect();
    console.log('✅ Prisma connection successful');

    // Test a query
    const count = await prisma.document.count();
    console.log(`Found ${count} documents in the database`);

    await prisma.$disconnect();
  } catch (err) {
    const error = err as Error;
    console.error('❌ Prisma connection failed:', error.message);
    process.exit(1);
  }

  console.log('\n✨ All database connections tested successfully!');
}

testLocalDb().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});