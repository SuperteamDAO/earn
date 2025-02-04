import { Connection, PublicKey } from '@solana/web3.js';
import type { NextApiRequest, NextApiResponse } from 'next';

import { privy } from '@/lib/privy';

import { getPrivyToken } from '@/features/auth/utils/getPrivyToken';
import { type TokenActivity } from '@/features/wallet/types/TokenActivity';
import { fetchWalletActivity } from '@/features/wallet/utils/fetchWalletActivity';

interface ErrorResponse {
  error: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TokenActivity[] | ErrorResponse>,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const privyDid = await getPrivyToken(req);

  if (!privyDid) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = await privy.getUser(privyDid);

  const walletAddress = user.wallet?.address;

  if (!walletAddress) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const connection = new Connection(
      `https://${process.env.NEXT_PUBLIC_RPC_URL}`,
      'confirmed',
    );
    const activities = await fetchWalletActivity(
      connection,
      new PublicKey(walletAddress),
    );
    return res.status(200).json(activities);
  } catch (error) {
    console.error('Error fetching activity:', error);
    return res.status(500).json({ error: 'Failed to fetch activity' });
  }
}
