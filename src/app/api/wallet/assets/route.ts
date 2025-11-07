import { PublicKey } from '@solana/web3.js';
import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/prisma';

import { getUserSession } from '@/features/auth/utils/getUserSession';
import { type TokenAsset } from '@/features/wallet/types/TokenAsset';
import { fetchUserTokens } from '@/features/wallet/utils/fetchUserTokens';
import { getConnection } from '@/features/wallet/utils/getConnection';

interface ErrorResponse {
  error: string;
}

export async function GET(
  _request: NextRequest,
): Promise<NextResponse<TokenAsset[] | ErrorResponse>> {
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

    const walletAddress = user?.walletAddress;

    if (!walletAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const connection = getConnection('confirmed');
    const assets = await fetchUserTokens(
      connection,
      new PublicKey(walletAddress),
    );
    return NextResponse.json(assets);
  } catch (error) {
    console.error('Error fetching token data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token data' },
      { status: 500 },
    );
  }
}
