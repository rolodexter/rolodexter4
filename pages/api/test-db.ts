import { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from '@neondatabase/serverless';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  let pool: Pool | null = null;

  try {
    // Log environment variables (without sensitive info)
    console.log('Environment variables:', {
      POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL ? '[SET]' : '[NOT SET]',
      POSTGRES_URL_NON_POOLING: process.env.POSTGRES_URL_NON_POOLING ? '[SET]' : '[NOT SET]',
      DATABASE_URL: process.env.DATABASE_URL ? '[SET]' : '[NOT SET]',
      NODE_ENV: process.env.NODE_ENV
    });

    // Create a connection pool
    const dbUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('No database URL configured');
    }

    pool = new Pool({ connectionString: dbUrl });
    console.log('Pool created, testing connection...');

    // Test the connection
    const client = await pool.connect();
    console.log('Connected to database');

    try {
      // Get database version
      const versionResult = await client.query('SELECT version()');
      console.log('Database version:', versionResult.rows[0].version);

      // Count documents
      const countResult = await client.query('SELECT COUNT(*) FROM "Document"');
      const totalDocs = parseInt(countResult.rows[0].count);
      console.log('Total documents:', totalDocs);

      // Get sample documents
      const sampleResult = await client.query(`
        SELECT id, title, path, type, created_at, updated_at 
        FROM "Document" 
        LIMIT 5
      `);
      console.log('Sample documents fetched:', sampleResult.rows.length);

      return res.status(200).json({
        connection: 'ok',
        connectionType: 'direct',
        env: {
          POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL ? '[SET]' : '[NOT SET]',
          POSTGRES_URL_NON_POOLING: process.env.POSTGRES_URL_NON_POOLING ? '[SET]' : '[NOT SET]',
          DATABASE_URL: process.env.DATABASE_URL ? '[SET]' : '[NOT SET]',
          NODE_ENV: process.env.NODE_ENV
        },
        version: versionResult.rows[0].version,
        documentCount: totalDocs,
        sampleDocuments: sampleResult.rows
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database test failed:', error);
    return res.status(500).json({
      error: 'Database test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      env: {
        POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL ? '[SET]' : '[NOT SET]',
        POSTGRES_URL_NON_POOLING: process.env.POSTGRES_URL_NON_POOLING ? '[SET]' : '[NOT SET]',
        DATABASE_URL: process.env.DATABASE_URL ? '[SET]' : '[NOT SET]',
        NODE_ENV: process.env.NODE_ENV
      }
    });
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}
