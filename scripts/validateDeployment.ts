import { createClient } from '@vercel/postgres';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { put, list } from '@vercel/blob';
import { join } from 'path';
import { testDatabaseConnection } from '../utils/db';

// Load environment variables
dotenv.config({ path: join(process.cwd(), '.env.local') });

type EnvVar = 
  | 'POSTGRES_PRISMA_URL' 
  | 'POSTGRES_URL' 
  | 'POSTGRES_URL_NON_POOLING'
  | 'BLOB_READ_WRITE_TOKEN'
  | 'NEXT_PUBLIC_VERCEL_ENV';

type EnvCategories = {
  database: EnvVar[];
  blob: EnvVar[];
  nextjs: EnvVar[];
};

const requiredEnvVars: EnvCategories = {
  database: ['POSTGRES_PRISMA_URL', 'POSTGRES_URL', 'POSTGRES_URL_NON_POOLING'],
  blob: ['BLOB_READ_WRITE_TOKEN'],
  nextjs: ['NEXT_PUBLIC_VERCEL_ENV']
};

async function validateEnvironmentVariables() {
  console.log('\nValidating environment variables...');
  let missingVars = [];

  for (const [category, vars] of Object.entries(requiredEnvVars)) {
    console.log(`\nChecking ${category} configuration...`);
    for (const envVar of vars) {
      if (!process.env[envVar]) {
        missingVars.push(envVar);
        console.error(`❌ Missing ${envVar}`);
      } else {
        console.log(`✓ ${envVar} is set`);
      }
    }
  }

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}

async function validateBlobStorage() {
  console.log('\nValidating Vercel Blob Storage...');
  try {
    const { blobs } = await list();
    console.log(`✓ Successfully accessed Blob Storage`);
    console.log(`✓ Found ${blobs.length} files`);
    return true;
  } catch (error) {
    console.error('❌ Blob Storage validation failed:', error);
    throw error;
  }
}

async function validateDatabase() {
  console.log('\nValidating database connection...');
  try {
    // Test both Prisma and Vercel Postgres connections
    const isConnected = await testDatabaseConnection();
    if (!isConnected) {
      throw new Error('Database connection test failed');
    }

    // Verify schema
    const prisma = new PrismaClient();
    const documents = await prisma.document.findFirst();
    console.log('✓ Database schema is accessible');
    
    await prisma.$disconnect();
    return true;
  } catch (error) {
    console.error('❌ Database validation failed:', error);
    throw error;
  }
}

async function validateNextConfig() {
  console.log('\nValidating Next.js configuration...');
  try {
    const configPath = join(process.cwd(), 'next.config.js');
    // Check if next.config.js exists
    await import(configPath);
    console.log('✓ next.config.js is valid');
    return true;
  } catch (error) {
    console.error('❌ Next.js configuration validation failed:', error);
    throw error;
  }
}

async function validateDeploymentSetup() {
  console.log('Starting deployment validation...');
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Vercel Environment:', process.env.NEXT_PUBLIC_VERCEL_ENV || 'local');

  try {
    // Run all validations
    await validateEnvironmentVariables();
    await validateDatabase();
    await validateBlobStorage();
    await validateNextConfig();

    console.log('\n✅ All deployment validations passed successfully!');
  } catch (error) {
    console.error('\n❌ Deployment validation failed:', error);
    process.exit(1);
  }
}

// Run validation
validateDeploymentSetup().catch(error => {
  console.error('Validation failed:', error);
  process.exit(1);
});