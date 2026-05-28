import type { NextApiRequest, NextApiResponse } from 'next';

import {
  addVerifiedJupiterToken,
  getTokenList,
  normalizeTokenIcon,
  type JupiterToken,
  searchTokenList,
} from '@/server/tokenList';
import { setCacheHeaders } from '@/utils/cacheControl';
import { sortJupiterTokenSearchResults } from '@/utils/tokenSearch';

import { withSponsorAuth } from '@/features/auth/utils/withSponsorAuth';

const JUPITER_TOKEN_SEARCH_URL = 'https://api.jup.ag/tokens/v2/search';

async function searchJupiterTokens(query: string): Promise<JupiterToken[]> {
  const response = await fetch(
    `${JUPITER_TOKEN_SEARCH_URL}?query=${encodeURIComponent(query)}`,
  );

  if (!response.ok) {
    throw new Error('Failed to search Jupiter tokens');
  }

  const tokens = (await response.json()) as JupiterToken[];
  return Array.isArray(tokens)
    ? sortJupiterTokenSearchResults(
        tokens.map((token) => ({
          ...token,
          icon: normalizeTokenIcon(token.icon),
        })),
        query,
      )
    : [];
}

const handleError = (error: unknown, res: NextApiResponse) => {
  console.error('Failed to load token metadata', error);
  return res.status(500).json({ error: 'Failed to load token metadata' });
};

const handlePost = withSponsorAuth(async (req, res) => {
  try {
    const mintAddress =
      typeof req.body?.mintAddress === 'string'
        ? req.body.mintAddress.trim()
        : '';

    if (!mintAddress) {
      return res.status(400).json({ error: 'Mint address is required' });
    }

    const jupiterTokens = await searchJupiterTokens(mintAddress);
    const jupiterToken = jupiterTokens.find(
      (token) => token.id === mintAddress,
    );

    if (!jupiterToken) {
      return res.status(404).json({ error: 'Token not found on Jupiter' });
    }

    const result = await addVerifiedJupiterToken(jupiterToken);

    if (result.type === 'unverified-token') {
      return res.status(400).json({ error: 'Token is not verified' });
    }

    if (result.type === 'symbol-conflict') {
      return res.status(409).json({ error: 'Token symbol already exists' });
    }

    return res.status(200).json({ token: result.token });
  } catch (error) {
    return handleError(error, res);
  }
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    setCacheHeaders(res, {
      noStore: true,
    });

    if (req.method === 'GET') {
      const query =
        typeof req.query.query === 'string' ? req.query.query.trim() : '';

      if (query) {
        const [tokens, jupiterTokens] = await Promise.all([
          searchTokenList(query),
          searchJupiterTokens(query),
        ]);

        return res.status(200).json({ tokens, jupiterTokens });
      }

      const tokens = await getTokenList();
      return res.status(200).json({ tokens });
    }

    if (req.method === 'POST') {
      return handlePost(req, res);
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return handleError(error, res);
  }
}
