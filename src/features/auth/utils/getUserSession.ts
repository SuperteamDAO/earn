import type { ReadonlyHeaders } from 'next/dist/server/web/spec-extension/adapters/headers';
import { cookies } from 'next/headers';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';

import { getPrivyToken } from './getPrivyToken';

type SessionResponse = {
  status: number;
  error: string | null;
  data: {
    userId: string;
  } | null;
};

export async function getUserSession(
  headers: ReadonlyHeaders,
): Promise<SessionResponse> {
  try {
    const authHeader = headers.get('authorization');
    const cookieHeader = headers.get('cookie');

    const req = {
      headers: {
        authorization: authHeader,
        cookie: cookieHeader,
      },
      cookies: Object.fromEntries(
        (await cookies()).getAll().map((c) => [c.name, c.value]),
      ),
    };

    const privyDid = await getPrivyToken(req as any);

    if (!privyDid) {
      return {
        status: 401,
        error: 'Unauthorized',
        data: null,
      };
    }

    logger.debug(`Fetching user with privyDid: ${privyDid}`);
    const user = await prisma.user.findUnique({
      where: { privyDid },
      select: {
        id: true,
      },
    });
    logger.info(`User with privyDid: ${privyDid} found`, {
      privyDid,
      ...user,
    });

    if (!user) {
      logger.warn('User has no record or is unauthorized');
      return {
        status: 403,
        error: 'User has no record or is unauthorized',
        data: null,
      };
    }

    return {
      status: 200,
      error: null,
      data: {
        userId: user.id,
      },
    };
  } catch (error) {
    logger.error('Error verifying user sponsor:', error);
    return {
      status: 500,
      error: 'Internal Server Error',
      data: null,
    };
  }
}
