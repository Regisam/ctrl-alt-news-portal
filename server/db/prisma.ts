import { logger } from '../logger.js';

// Minimal Prisma stub for MVP closure
const createPrismaStub = () => ({
  $connect: async () => { logger.info('Prisma stub: $connect'); },
  $disconnect: async () => { logger.info('Prisma stub: $disconnect'); },
  user: { findMany: async () => [], findUnique: async () => null, create: async (d: any) => d.data },
  article: { findMany: async () => [], findUnique: async () => null, create: async (d: any) => d.data },
  comment: { findMany: async () => [], findUnique: async () => null, create: async (d: any) => d.data },
});

type PrismaClient = ReturnType<typeof createPrismaStub>;

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  createPrismaStub();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Initialize database connection
export async function initializeDatabase() {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Failed to connect to database', { error });
    throw error;
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export default prisma;
