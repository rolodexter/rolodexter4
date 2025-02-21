import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Log environment variables (without sensitive info)
  const envVars = {
    POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL ? '[SET]' : '[NOT SET]',
    POSTGRES_URL_NON_POOLING: process.env.POSTGRES_URL_NON_POOLING ? '[SET]' : '[NOT SET]',
    DATABASE_URL: process.env.DATABASE_URL ? '[SET]' : '[NOT SET]',
    NODE_ENV: process.env.NODE_ENV
  };
  console.log('Environment variables:', envVars);

  try {
    console.log('Testing database connection...');
    
    // Test connection by counting documents
    const documentCount = await prisma.document.count();
    console.log('Document count:', documentCount);

    // Get sample documents
    const sampleDocuments = await prisma.document.findMany({
      select: {
        id: true,
        title: true,
        path: true,
        type: true,
        created_at: true,
        updated_at: true
      },
      take: 5
    });
    console.log('Sample documents fetched:', sampleDocuments.length);

    return res.status(200).json({
      connection: 'ok',
      connectionType: 'prisma',
      env: envVars,
      documentCount,
      sampleDocuments
    });
  } catch (error) {
    console.error('Database test failed:', error);
    if (error instanceof Error) {
      console.error('Database test failed stack:', error.stack);
    }
    return res.status(500).json({
      error: 'Database test failed',
      details: error instanceof Error ? error.message : JSON.stringify(error),
      env: envVars
    });
  } finally {
    await prisma.$disconnect();
  }
}
