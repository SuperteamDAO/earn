import type { NextApiRequest, NextApiResponse } from 'next';

import { getTokenList } from '@/server/tokenList';

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const tokens = await getTokenList();
    res.status(200).json({ tokens });
  } catch (error) {
    console.error('Failed to load token metadata', error);
    res.status(500).json({ error: 'Failed to load token metadata' });
  }
}
