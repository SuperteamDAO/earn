import type { ReadonlyHeaders } from 'next/dist/server/web/spec-extension/adapters/headers';
import { cookies } from 'next/headers';
import { getToken } from 'next-auth/jwt';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';

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

    const token = await getToken({ req: req as any });

    if (!token) {
      return {
        status: 401,
        error: 'Unauthorized',
        data: null,
      };
    }

    const userId = token.sub;
    if (!userId) {
      return {
        status: 400,
        error: 'Invalid token',
        data: null,
      };
    }

    logger.debug(`Fetching user with ID: ${userId}`);
    const user = await prisma.user.findUnique({
      where: { id: userId as string },
      select: { id: true },
    });
    logger.info(`User with ID: ${userId} found`, {
      userId,
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
        userId,
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
