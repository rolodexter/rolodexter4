import { PrismaClient, Prisma } from '@prisma/client';

// Add global type for Prisma
declare global {
  var prisma: PrismaClient | undefined;
}

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
  if (process.env.NODE_ENV !== 'production') {
    global.prisma = prisma;
  }
} else {
  prisma = global.prisma;
}

// Helper function to create search conditions
function createSearchConditions(query: string): Prisma.DocumentWhereInput {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  
  return {
    OR: words.map(word => ({
      OR: [
        { title: { contains: word, mode: 'insensitive' } },
        { content: { contains: word, mode: 'insensitive' } },
        { path: { contains: word, mode: 'insensitive' } }
      ]
    }))
  };
}

// Search documents with full-text search
export async function searchDocuments(query: string) {
  try {
    console.log('Starting search with query:', query);
    
    // Create search conditions
    const whereCondition = createSearchConditions(query);
    console.log('Search conditions:', JSON.stringify(whereCondition, null, 2));

    const results = await prisma.document.findMany({
      where: whereCondition,
      select: {
        id: true,
        title: true,
        content: true,
        path: true,
        type: true,
        metadata: true,
        created_at: true,
        updated_at: true
      },
      orderBy: {
        updated_at: 'desc'
      },
      take: 20
    });

    console.log('Found documents:', results.length);
    return results;

  } catch (error) {
    console.error('Search failed:', error);
    throw error;
  }
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

export default prisma;