// server/src/prisma.ts
// Prisma Client Factory with Singleton Pattern
// Ensures a single database connection throughout the application lifecycle

import { PrismaClient } from '@prisma/client';

// Use a global variable to store the Prisma Client instance
// This prevents creating multiple instances during development (HMR)
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

// Store in global for development mode (prevents HMR from creating new instances)
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Graceful shutdown: disconnect when process receives SIGINT or SIGTERM
process.on('SIGINT', async () => {
  console.log('SIGINT received, disconnecting Prisma...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, disconnecting Prisma...');
  await prisma.$disconnect();
  process.exit(0);
});

export default prisma;
