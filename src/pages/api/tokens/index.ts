import type { NextApiRequest, NextApiResponse } from 'next';

import { getTokenList } from '@/server/tokenList';
import { setCacheHeaders } from '@/utils/cacheControl';

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    setCacheHeaders(res, {
      noStore: true,
    });

    const tokens = await getTokenList();
    res.status(200).json({ tokens });
  } catch (error) {
    console.error('Failed to load token metadata', error);
    res.status(500).json({ error: 'Failed to load token metadata' });
  }
}
