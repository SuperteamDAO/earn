import { Client } from '@planetscale/database';
import { PrismaPlanetScale } from '@prisma/adapter-planetscale';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let prismaClient: PrismaClient;

try {
  const client = new Client({ url: process.env.DATABASE_URL });
  const adapter = new PrismaPlanetScale(client);
  prismaClient = new PrismaClient({ adapter });
} catch (error) {
  if (process.env.NODE_ENV === 'production') {
    throw error;
  }
  console.warn('PlanetScale setup failed, falling back to MySQL:', error);
  prismaClient = new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? prismaClient;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
