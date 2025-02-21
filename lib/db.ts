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
    // Split query into words for better matching
    const searchTerms = query.toLowerCase().split(/\s+/).filter(Boolean);
    
    // Create OR conditions for each search term
    const whereConditions = searchTerms.map(term => ({
      OR: [
        { title: { contains: term, mode: 'insensitive' } },
        { content: { contains: term, mode: 'insensitive' } },
      ],
    }));

    const results = await prisma.document.findMany({
      where: {
        AND: whereConditions,
      },
      select: {
        title: true,
        path: true,
        metadata: true,
      },
      orderBy: {
        created_at: 'desc',
      },
      take: 10,
    });

    return results;
  } catch (error) {
    console.error('Search failed:', error);
    throw error;
  }
};

export default prisma;