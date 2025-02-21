import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    console.log('Database connection successful');

    // Count documents
    const totalDocs = await prisma.document.count();
    console.log('Total documents:', totalDocs);

    // Get a sample of documents
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

    return res.status(200).json({
      connection: 'ok',
      documentCount: totalDocs,
      sampleDocuments: sampleDocs
    });
  } catch (error) {
    console.error('Database test failed:', error);
    return res.status(500).json({
      error: 'Database test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
