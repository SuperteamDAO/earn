import { PrismaClient } from '@prisma/client';

const prismaClient = () => {
  return new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
  });
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClient>;
} & typeof global;

export const prisma = globalThis.prismaGlobal ?? prismaClient();

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;
