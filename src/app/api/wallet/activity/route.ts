import { PublicKey } from '@solana/web3.js';
import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

import { privy } from '@/lib/privy';

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

    const { privyDid } = sessionResponse.data;

    if (!privyDid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await privy.getUser(privyDid);

    const walletAddress = user.wallet?.address;

    if (!walletAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const connection = getConnection('confirmed');
    const activities = await fetchWalletActivity(
      connection,
      new PublicKey(walletAddress),
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
