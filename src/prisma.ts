// import { PrismaMariaDb } from '@prisma/adapter-mariadb'; // uncomment this if you are using local Mysql / MariaDB
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
  // For local DB setups (MySQL/MariaDB), use PrismaClient without adapter
  // If you need the MariaDB adapter, uncomment the following code:
  // const url = new URL(databaseUrl);
  // const adapter = new PrismaMariaDb({
  //   host: url.hostname,
  //   port: parseInt(url.port) || 3306,
  //   user: url.username || 'root',
  //   password: url.password || undefined,
  //   database: url.pathname.slice(1),
  //   connectionLimit: 5,
  // });
  // prismaClient = new PrismaClient({
  //   adapter,
  //   omit: omitConfig,
  //   transactionOptions: { maxWait: 5000, timeout: 15000 },
  // });

  // Default: PrismaClient without adapter (works for local MySQL/MariaDB)
  prismaClient = new PrismaClient({
    omit: omitConfig,
    transactionOptions: { maxWait: 5000, timeout: 15000 },
  } as any);
}

declare const globalThis: { prismaGlobal: typeof prismaClient } & typeof global;

export const prisma = globalThis.prismaGlobal ?? prismaClient;

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;
