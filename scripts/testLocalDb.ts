import { PrismaClient } from '@prisma/client';
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: join(process.cwd(), '.env.local') });

async function testLocalDb() {
  console.log('Testing local database connection...\n');

  // Test direct PostgreSQL connection
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'rolodexter4',
    user: 'postgres',
    password: '808080'
  });

  try {
    console.log('Attempting direct PostgreSQL connection...');
    await client.connect();
    const result = await client.query('SELECT version()');
    console.log('✓ Direct PostgreSQL connection successful');
    console.log('PostgreSQL version:', result.rows[0].version);
    await client.end();
  } catch (error) {
    console.error('❌ Direct PostgreSQL connection failed:', error.message);
    process.exit(1);
  }

  // Test Prisma connection
  const prisma = new PrismaClient();
  try {
    console.log('\nAttempting Prisma connection...');
    await prisma.$connect();
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✓ Prisma connection successful');
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Prisma connection failed:', error.message);
    process.exit(1);
  }

  console.log('\n✅ All database connections successful!');
}

testLocalDb().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
}); 