import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/db';

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

    // Test database connection
    console.log('Testing database connection...');
    await prisma.$queryRaw`SELECT version()`;
    console.log('Database connection successful');

    // Count documents
    console.log('Counting documents...');
    const totalDocs = await prisma.document.count();
    console.log('Total documents:', totalDocs);

    // Get a sample of documents
    console.log('Fetching sample documents...');
    const sampleDocs = await prisma.document.findMany({
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
    console.log('Sample documents fetched:', sampleDocs.length);

    return res.status(200).json({
      connection: 'ok',
      env: {
        POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL ? '[SET]' : '[NOT SET]',
        POSTGRES_URL_NON_POOLING: process.env.POSTGRES_URL_NON_POOLING ? '[SET]' : '[NOT SET]',
        DATABASE_URL: process.env.DATABASE_URL ? '[SET]' : '[NOT SET]',
        NODE_ENV: process.env.NODE_ENV
      },
      documentCount: totalDocs,
      sampleDocuments: sampleDocs
    });
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
