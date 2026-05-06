import type { NextApiRequest, NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { getPrivyToken } from '@/features/auth/utils/getPrivyToken';

const MAX_COMMENT_SUGGESTIONS = 5;

export default async function searchUser(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') {
    logger.warn(`Method not allowed: ${req.method}`);
    return res.status(405).end(`Method Not Allowed`);
  }

  const { query, take } = req.query;
  logger.info(
    `User search requested; queryLength=${typeof query === 'string' ? query.length : 0}, take=${typeof take === 'string' ? take : 'default'}`,
  );
  if (!query) {
    logger.warn('Query parameter is required');
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    const privyDid = await getPrivyToken(req);
    if (privyDid) {
      const user = await prisma.user.findUnique({
        where: { privyDid },
        select: { id: true, isBlocked: true },
      });

      if (user?.isBlocked) {
        logger.warn(`Blocked user attempted user search: ${user.id}`);
        return res.status(403).json({ error: 'User is blocked' });
      }
    }

    let takeNum = Number(take) || MAX_COMMENT_SUGGESTIONS;
    if (takeNum > MAX_COMMENT_SUGGESTIONS) takeNum = MAX_COMMENT_SUGGESTIONS;
    logger.debug(`Query parameter: ${query}, Take number: ${takeNum}`);

    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            username: {
              not: '',
            },
          },
          {
            username: {
              not: null,
            },
          },
          {
            OR: [
              {
                username: {
                  contains: query as string,
                },
              },
              {
                firstName: {
                  contains: query as string,
                },
              },
              {
                lastName: {
                  contains: query as string,
                },
              },
            ],
          },
        ],
      },
      take: takeNum,
      select: {
        id: true,
        username: true,
        photo: true,
        firstName: true,
        lastName: true,
      },
    });

    logger.info(`Users found: ${users.length}`);
    return res.status(200).json({ users });
  } catch (error: any) {
    logger.error(
      `Error occurred while searching for users: ${safeStringify(error)}`,
    );
    return res.status(500).json({
      message: `Error occurred while searching for user with query - ${query}.`,
    });
  }
}
