import { prisma } from '@/prisma';

import { WALLET_ADDRESS_CONFLICT_MESSAGE } from './walletAddressOwnership.constants';

type FoundationGrant = {
  isNative: boolean;
  airtableId: string | null;
};

export async function validateWalletAddressOwnership({
  grant,
  userId,
  walletAddress,
}: {
  grant: FoundationGrant;
  userId: string;
  walletAddress: string;
}) {
  if (!grant.isNative || !grant.airtableId) {
    return;
  }

  const [existingApplication, existingTranche] = await Promise.all([
    prisma.grantApplication.findFirst({
      where: {
        walletAddress,
        userId: { not: userId },
        grant: {
          isNative: true,
          airtableId: { not: null },
        },
      },
      select: { id: true },
    }),
    prisma.grantTranche.findFirst({
      where: {
        walletAddress,
        GrantApplication: {
          userId: { not: userId },
          grant: {
            isNative: true,
            airtableId: { not: null },
          },
        },
      },
      select: { id: true },
    }),
  ]);

  if (existingApplication || existingTranche) {
    throw new Error(WALLET_ADDRESS_CONFLICT_MESSAGE);
  }
}
