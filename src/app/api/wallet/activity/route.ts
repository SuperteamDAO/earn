import { PublicKey } from '@solana/web3.js';
import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/prisma';

import { getUserSession } from '@/features/auth/utils/getUserSession';
import { type TokenActivity } from '@/features/wallet/types/TokenActivity';
import { fetchWalletActivity } from '@/features/wallet/utils/fetchWalletActivity';
import { getConnection } from '@/features/wallet/utils/getConnection';

interface ErrorResponse {
  error: string;
}

export async function GET(
  _request: NextRequest,
): Promise<NextResponse<TokenActivity[] | ErrorResponse>> {
  try {
    const headersList = await headers();
    const sessionResponse = await getUserSession(headersList);

    if (sessionResponse.status !== 200 || !sessionResponse.data) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: sessionResponse.status },
      );
    }

    const { userId } = sessionResponse.data;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { walletAddress: true },
    });

    if (!user?.walletAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const connection = getConnection('confirmed');
    const activities = await fetchWalletActivity(
      connection,
      new PublicKey(user?.walletAddress),
    );
    return NextResponse.json(activities);
  } catch (error) {
    console.error('Error fetching activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity' },
      { status: 500 },
    );
  }
}
