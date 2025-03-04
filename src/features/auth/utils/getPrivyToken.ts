import { type IncomingMessage } from 'http';
import { type NextApiRequest } from 'next';
import { type NextApiRequestCookies } from 'next/dist/server/api-utils';

import logger from '@/lib/logger';
import { privy } from '@/lib/privy';
import { safeStringify } from '@/utils/safeStringify';

export async function getPrivyToken(
  req:
    | NextApiRequest
    | (IncomingMessage & {
        cookies: NextApiRequestCookies;
      }),
): Promise<string | null> {
  try {
    const accessToken =
      req.cookies['privy-token'] ||
      req.headers?.authorization?.replace('Bearer ', '');

    if (!accessToken) {
      logger.error(
        'Unauthorized, Privy access token not found in cookies or authorization header',
      );
      return null;
    }
    logger.info('Access token found in cookies ', accessToken);

    const claims = await privy.verifyAuthToken(
      accessToken,
      process.env.PRIVY_VERIFICATION_KEY,
    );
    logger.debug('Authorized, found full privy claim from token', claims);

    return claims.userId;
  } catch (error) {
    logger.error(
      'Unauthorized, Error verifying auth token ',
      safeStringify(error),
    );
    return null;
  }
}
