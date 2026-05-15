import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithSponsor } from '@/features/auth/types';
import { withSponsorAuth } from '@/features/auth/utils/withSponsorAuth';

async function coreMembers(
  req: NextApiRequestWithSponsor,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { chapterId } = req.query;

  if (typeof chapterId !== 'string') {
    return res.status(400).json({ message: 'Chapter id is required' });
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        isBlocked: false,
        people: {
          is: {
            chapterId,
            type: {
              in: ['core'],
            },
          },
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        people: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [
        {
          firstName: 'asc',
        },
        {
          lastName: 'asc',
        },
      ],
    });

    const coreMembers = users
      .map((user) => {
        const fullName = [user.firstName, user.lastName]
          .filter(Boolean)
          .join(' ')
          .trim();

        return {
          id: user.id,
          name: fullName || user.people?.name || '',
        };
      })
      .filter((user) => Boolean(user.name));

    return res.status(200).json({ coreMembers });
  } catch (error) {
    logger.error(
      `Error fetching core members for chapter ${chapterId}: ${safeStringify(error)}`,
    );
    return res.status(500).json({ message: 'Failed to fetch core members' });
  }
}

export default withSponsorAuth(coreMembers);
