import { Connection, PublicKey } from '@solana/web3.js';
import type { NextApiRequest, NextApiResponse } from 'next';

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

  const { publicKey } = req.query;

  if (!publicKey || typeof publicKey !== 'string') {
    return res.status(400).json({ error: 'Public key is required' });
  }

  try {
    const connection = new Connection(SOLANA_RPC_URL, 'confirmed');
    const assets = await fetchUserTokens(connection, new PublicKey(publicKey));
    return res.status(200).json(assets);
  } catch (error) {
    console.error('Error fetching token data:', error);
    return res.status(500).json({ error: 'Failed to fetch token data' });
  }
}
