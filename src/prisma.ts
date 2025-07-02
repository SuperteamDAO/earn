import { PrismaPlanetScale } from '@prisma/adapter-planetscale';
import { PrismaClient } from '@prisma/client';

const prismaClient = () => {
  return process.env.DATABASE_URL
    ? new PrismaClient({
        adapter: new PrismaPlanetScale({
          url: process.env.DATABASE_URL,
        }),
        omit: {
          user: {
            kycCountry: true,
            kycAddress: true,
            kycDOB: true,
            kycIDNumber: true,
            kycIDType: true,
            kycName: true,
          },
        },
      })
    : new PrismaClient({
        datasourceUrl: process.env.LOCAL_DATABASE_URL,
      });
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClient>;
} & typeof global;

export const prisma = globalThis.prismaGlobal ?? prismaClient();

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;
