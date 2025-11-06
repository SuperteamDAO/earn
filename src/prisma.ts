import { PrismaPlanetScale } from '@prisma/adapter-planetscale';

import { PrismaClient } from '@/prisma/client';

const omitConfig = {
  user: {
    kycCountry: true,
    kycAddress: true,
    kycDOB: true,
    kycIDNumber: true,
    kycIDType: true,
    kycName: true,
  },
};

const databaseUrl = process.env.DATABASE_URL || '';
const isPlanetScale =
  databaseUrl.includes('aws.connect.psdb.cloud') ||
  databaseUrl.includes('.psdb.cloud') ||
  databaseUrl.includes('planetscale');

let prismaClient: PrismaClient;

if (isPlanetScale) {
  const adapter = new PrismaPlanetScale({ url: databaseUrl, fetch });

  prismaClient = new PrismaClient({
    adapter,
    omit: omitConfig,
    transactionOptions: { maxWait: 5000, timeout: 15000 },
  });
} else {
  prismaClient = new PrismaClient({
    omit: omitConfig,
    transactionOptions: { maxWait: 5000, timeout: 15000 },
  });
}

declare const globalThis: { prismaGlobal: typeof prismaClient } & typeof global;

export const prisma = globalThis.prismaGlobal ?? prismaClient;

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;
