import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { Pool } from '@neondatabase/serverless';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Log environment variables (without sensitive info)
    console.log('Environment variables:', {
      POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL ? '[SET]' : '[NOT SET]',
      POSTGRES_URL_NON_POOLING: process.env.POSTGRES_URL_NON_POOLING ? '[SET]' : '[NOT SET]',
      DATABASE_URL: process.env.DATABASE_URL ? '[SET]' : '[NOT SET]',
      NODE_ENV: process.env.NODE_ENV
    });

    // Try to connect using non-pooled connection first
    const nonPooledClient = new PrismaClient({
      datasources: {
        db: {
          url: process.env.POSTGRES_URL_NON_POOLING
        }
      }
    });

    try {
      console.log('Testing non-pooled connection...');
      await nonPooledClient.$connect();
      console.log('Non-pooled connection successful');
      
      // Test query
      const version = await nonPooledClient.$queryRaw`SELECT version()`;
      console.log('Database version:', version);

      // Count documents
      const totalDocs = await nonPooledClient.document.count();
      console.log('Total documents:', totalDocs);

      // Get a sample of documents
      const sampleDocs = await nonPooledClient.document.findMany({
        take: 5,
        select: {
          id: true,
          title: true,
          path: true,
          type: true,
          created_at: true,
          updated_at: true
        }
      });

      await nonPooledClient.$disconnect();

      return res.status(200).json({
        connection: 'ok',
        connectionType: 'non-pooled',
        env: {
          POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL ? '[SET]' : '[NOT SET]',
          POSTGRES_URL_NON_POOLING: process.env.POSTGRES_URL_NON_POOLING ? '[SET]' : '[NOT SET]',
          DATABASE_URL: process.env.DATABASE_URL ? '[SET]' : '[NOT SET]',
          NODE_ENV: process.env.NODE_ENV
        },
        documentCount: totalDocs,
        sampleDocuments: sampleDocs
      });
    } catch (nonPooledError) {
      console.error('Non-pooled connection failed:', nonPooledError);

      // Try pooled connection as fallback
      const pooledClient = new PrismaClient({
        datasources: {
          db: {
            url: process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL
          }
        }
      });

      try {
        console.log('Testing pooled connection...');
        await pooledClient.$connect();
        console.log('Pooled connection successful');

        // Test query
        const version = await pooledClient.$queryRaw`SELECT version()`;
        console.log('Database version:', version);

        // Count documents
        const totalDocs = await pooledClient.document.count();
        console.log('Total documents:', totalDocs);

        // Get a sample of documents
        const sampleDocs = await pooledClient.document.findMany({
          take: 5,
          select: {
            id: true,
            title: true,
            path: true,
            type: true,
            created_at: true,
            updated_at: true
          }
        });

        await pooledClient.$disconnect();

        return res.status(200).json({
          connection: 'ok',
          connectionType: 'pooled',
          env: {
            POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL ? '[SET]' : '[NOT SET]',
            POSTGRES_URL_NON_POOLING: process.env.POSTGRES_URL_NON_POOLING ? '[SET]' : '[NOT SET]',
            DATABASE_URL: process.env.DATABASE_URL ? '[SET]' : '[NOT SET]',
            NODE_ENV: process.env.NODE_ENV
          },
          documentCount: totalDocs,
          sampleDocuments: sampleDocs
        });
      } catch (pooledError) {
        console.error('Both connection attempts failed:', {
          nonPooled: nonPooledError,
          pooled: pooledError
        });
        throw new Error('All connection attempts failed');
      } finally {
        await pooledClient.$disconnect();
      }
    } finally {
      await nonPooledClient.$disconnect();
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
  }
}
