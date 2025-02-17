import { Client } from 'pg';
import * as dotenv from 'dotenv';
import { put, list } from '@vercel/blob';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: join(process.cwd(), '.env.local') });

async function validateDeploymentSetup() {
  console.log('Validating deployment setup...');

  // Check Blob Storage access
  try {
    console.log('Checking Vercel Blob Storage access...');
    if (!process.env.BLOB_READ_WRITE_TOKEN || !process.env.BLOB_STORE_NAME) {
      throw new Error('Missing Blob Storage configuration');
    }
    
    // List blobs to verify access
    const { blobs } = await list();
    console.log(`Successfully accessed Blob Storage. Found ${blobs.length} files`);
  } catch (error) {
    console.error('Blob Storage check failed:', error);
    process.exit(1);
  }

  // Check Database Connection
  const client = new Client({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: Number(process.env.POSTGRES_PORT) || 5432,
    database: process.env.POSTGRES_DATABASE || 'rolodexter4',
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || '808080',
    ssl: process.env.POSTGRES_SSL === 'true'
  });

  try {
    console.log('Checking database connection...');
    await client.connect();
    console.log('Successfully connected to database');
    
    // Verify Prisma schema sync
    const tableResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'Document'
      );
    `);
    
    if (!tableResult.rows[0].exists) {
      console.warn('Warning: Schema not synced. Run npm run db:push to sync schema');
    } else {
      console.log('Database schema is synced');
    }

    await client.end();
  } catch (error) {
    console.error('Database check failed:', error);
    if (process.env.VERCEL_ENV === 'production') {
      console.error('Error in production environment. Check Vercel deployment settings.');
    } else {
      console.error('Error in local environment. Make sure PostgreSQL is running.');
    }
    process.exit(1);
  }
}

validateDeploymentSetup().catch(console.error);