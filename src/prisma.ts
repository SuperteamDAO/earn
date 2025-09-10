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

// if using planetscale db, use this. if not, comment out and uncomment the local db setup below

const adapter = new PrismaPlanetScale({ url: process.env.DATABASE_URL, fetch });
const prismaClient = new PrismaClient({ adapter, omit: omitConfig });

// if using local db, uncomment this and comment out the above
// const datasourceUrl = process.env.LOCAL_DATABASE_URL;
// const prismaClient = new PrismaClient({ datasourceUrl, omit: omitConfig });

declare const globalThis: { prismaGlobal: typeof prismaClient } & typeof global;

export const prisma = globalThis.prismaGlobal ?? prismaClient;

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;
