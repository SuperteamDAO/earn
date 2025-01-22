import { Connection, PublicKey } from '@solana/web3.js';
import type { NextApiRequest, NextApiResponse } from 'next';

import { privy } from '@/lib/privy';

import { getPrivyToken } from '@/features/auth/utils/getPrivyToken';
import {
  fetchUserTokens,
  type TokenAsset,
} from '@/features/wallet/utils/fetchUserTokens';
interface ErrorResponse {
  error: string;
}

const SOLANA_RPC_URL = 'https://api.mainnet-beta.solana.com';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TokenAsset[] | ErrorResponse>,
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
    const connection = new Connection(SOLANA_RPC_URL, 'confirmed');
    const assets = await fetchUserTokens(
      connection,
      new PublicKey(walletAddress),
    );
    return res.status(200).json(assets);
  } catch (error) {
    console.error('Error fetching token data:', error);
    return res.status(500).json({ error: 'Failed to fetch token data' });
  }
}
