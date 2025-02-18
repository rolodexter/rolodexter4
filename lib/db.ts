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

export default prisma;