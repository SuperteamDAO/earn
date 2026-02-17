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
    let accessToken = req.headers?.authorization?.replace('Bearer ', '');
    if (accessToken) {
      logger.debug('Auth token found in `authorization` header');
    }

    // COOKIE IS NEEDED FOR SSR AUTH (getServerSideProps)
    // BUT WE MIGHT MISS AND USE `axios` accidentally instead of `@/lib/api` ON FRONTEND, hence log
    if (!accessToken) {
      accessToken = req.cookies['privy-token'];
      if (accessToken) {
        console.warn('PLEASE USE `@/lib/api` FROM FRONTEND INSTEAD OF `axios`');
      }
    }

    if (!accessToken) {
      logger.error(
        'Unauthorized, Privy access token not found in cookies or authorization header',
      );
      return null;
    }

    const verifiedClaims = await privy
      .utils()
      .auth()
      .verifyAuthToken(accessToken);
    logger.debug(
      `Authorized token for Privy user ${verifiedClaims.user_id}`,
      safeStringify({ appId: verifiedClaims.app_id, sessionId: 'redacted' }),
    );

    return verifiedClaims.user_id;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown auth token error';
    logger.error(`Unauthorized, Error verifying auth token: ${errorMessage}`);
    return null;
  }
}
