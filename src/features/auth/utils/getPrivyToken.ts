import { type IncomingMessage } from 'http';
import { type NextApiRequest } from 'next';
import { type NextApiRequestCookies } from 'next/dist/server/api-utils';

import { privy } from '@/lib/privy';

export async function getPrivyToken(
  req:
    | NextApiRequest
    | (IncomingMessage & {
        cookies: NextApiRequestCookies;
      }),
): Promise<string | null> {
  try {
    const accessToken = req.cookies['privy-token'];

    if (!accessToken) {
      return null;
    }

    const claims = await privy.verifyAuthToken(
      accessToken,
      process.env.PRIVY_VERIFICATION_KEY,
    );

    return claims.userId;
  } catch (error) {
    return null;
  }
}
