import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

if (!global.prisma) {
  prisma = new PrismaClient({
    errorFormat: 'minimal',
    log: ['error']
  });
  // Attempt to connect and catch any errors to prevent crashing
  prisma.$connect().catch(e => {
    console.error('Postgres connection error suppressed:', e);
  });
  global.prisma = prisma;
} else {
  prisma = global.prisma;
}

export const testConnection = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    throw error;
  }
};

export const searchDocuments = async (query: string) => {
  try {
    console.log('Starting search with query:', query);
    
    // Split query into words for better matching
    const searchTerms = query.toLowerCase().split(/\s+/).filter(Boolean);
    console.log('Search terms:', searchTerms);
    
    // First, let's check if we have any documents at all
    const totalDocs = await prisma.document.count();
    console.log('Total documents in database:', totalDocs);

    // Create OR conditions for each search term
    const whereConditions = searchTerms.map(term => ({
      OR: [
        { title: { contains: term, mode: 'insensitive' } },
        { content: { contains: term, mode: 'insensitive' } },
      ],
    }));

    console.log('Search conditions:', JSON.stringify(whereConditions, null, 2));

    const results = await prisma.document.findMany({
      where: {
        AND: whereConditions,
      },
      select: {
        title: true,
        path: true,
        content: true,
        metadata: true,
      },
      orderBy: {
        created_at: 'desc',
      },
      take: 10,
    });

    console.log('Search results count:', results.length);
    if (results.length === 0) {
      // Let's try a broader search if no results found
      const broadResults = await prisma.document.findMany({
        where: {
          OR: searchTerms.map(term => ({
            OR: [
              { title: { contains: term, mode: 'insensitive' } },
              { content: { contains: term, mode: 'insensitive' } },
            ],
          })),
        },
        select: {
          title: true,
          path: true,
          content: true,
          metadata: true,
        },
        orderBy: {
          created_at: 'desc',
        },
        take: 10,
      });
      console.log('Broad search results count:', broadResults.length);
      return broadResults;
    }

    return results;
  } catch (error) {
    console.error('Search failed:', error);
    throw error;
  }
};

export default prisma;