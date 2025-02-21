import { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from '@neondatabase/serverless';

// Ensure database URL has the correct format for Neon
function formatDatabaseUrl(url: string): string {
  if (!url) return url;
  
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  let pool: Pool | null = null;

  // Log environment variables (without sensitive info)
  const envVars = {
    POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL ? '[SET]' : '[NOT SET]',
    POSTGRES_URL_NON_POOLING: process.env.POSTGRES_URL_NON_POOLING ? '[SET]' : '[NOT SET]',
    DATABASE_URL: process.env.DATABASE_URL ? '[SET]' : '[NOT SET]',
    NODE_ENV: process.env.NODE_ENV
  };
  console.log('Environment variables:', envVars);

  try {
    // Get database URL
    const dbUrl = formatDatabaseUrl(
      process.env.POSTGRES_URL_NON_POOLING || 
      process.env.POSTGRES_PRISMA_URL || 
      process.env.DATABASE_URL || 
      ''
    );

    if (!dbUrl) {
      throw new Error('No database URL configured');
    }

    // Log URL pattern (without sensitive info)
    console.log('Database URL pattern:', dbUrl.replace(/\/\/.*@/, '//****:****@'));

    try {
      // Create a connection pool
      console.log('Creating connection pool...');
      pool = new Pool({ 
        connectionString: dbUrl,
        max: 1,
        ssl: {
          rejectUnauthorized: true
        },
        connectionTimeoutMillis: 10000
      });
      console.log('Pool created successfully');

      // Test the connection
      console.log('Attempting to connect...');
      const client = await pool.connect();
      console.log('Connected to database successfully');

      try {
        // Get database version
        console.log('Querying database version...');
        const versionResult = await client.query('SELECT version()');
        console.log('Database version query successful');

        // Count documents
        console.log('Counting documents...');
        const countResult = await client.query('SELECT COUNT(*) FROM "Document"');
        const totalDocs = parseInt(countResult.rows[0].count);
        console.log('Document count successful:', totalDocs);

        // Get sample documents
        console.log('Fetching sample documents...');
        const sampleResult = await client.query(`
          SELECT id, title, path, type, created_at, updated_at 
          FROM "Document" 
          LIMIT 5
        `);
        console.log('Sample documents fetched:', sampleResult.rows.length);

        return res.status(200).json({
          connection: 'ok',
          connectionType: 'direct',
          env: envVars,
          version: versionResult.rows[0].version,
          documentCount: totalDocs,
          sampleDocuments: sampleResult.rows
        });
      } catch (error) {
        console.error('Query error:', error);
        if (error instanceof Error) {
          console.error('Query error stack:', error.stack);
        }
        throw new Error(`Database query failed: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        console.log('Releasing client...');
        await client.release();
        console.log('Client released');
      }
    } catch (error) {
      console.error('Connection error:', error);
      if (error instanceof Error) {
        console.error('Connection error stack:', error.stack);
      }
      throw new Error(`Database connection failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  } catch (error) {
    console.error('Database test failed:', error);
    if (error instanceof Error) {
      console.error('Database test failed stack:', error.stack);
    }
    return res.status(500).json({
      error: 'Database test failed',
      details: error instanceof Error ? error.message : String(error),
      env: envVars
    });
  } finally {
    if (pool) {
      console.log('Closing pool...');
      await pool.end();
      console.log('Pool closed');
    }
  }
}
