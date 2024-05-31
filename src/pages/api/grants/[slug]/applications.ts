import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import { prisma } from '@/prisma';

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  const userId = req.userId;

  const user = await prisma.user.findUnique({
    where: {
      id: userId as string,
    },
  });

  if (!user) {
    return res.status(400).json({ error: 'Unauthorized' });
  }

  const params = req.query;

  const slug = params.slug as string;
  const skip = params.take ? parseInt(params.skip as string, 10) : 0;
  const take = params.take ? parseInt(params.take as string, 10) : 15;

  const searchText = params.searchText as string;

  const whereSearch = searchText
    ? {
        OR: [
          {
            user: {
              firstName: {
                contains: searchText,
              },
            },
          },
          {
            user: {
              email: {
                contains: searchText,
              },
            },
          },
          {
            user: {
              username: {
                contains: searchText,
              },
            },
          },
          {
            user: {
              twitter: {
                contains: searchText,
              },
            },
          },
          {
            user: {
              discord: {
                contains: searchText,
              },
            },
          },
          {
            link: {
              contains: searchText,
            },
          },
        ],
      }
    : {};

  try {
    const applications = await prisma.grantApplication.findMany({
      where: {
        grant: {
          slug,
          isActive: true,
          sponsor: { id: user.currentSponsorId! },
        },
        ...whereSearch,
      },
      include: {
        user: true,
        grant: true,
      },
      orderBy: { createdAt: 'asc' },
      skip,
      take,
    });

    if (!applications) {
      return res.status(404).json({
        message: `Submissions with slug=${slug} not found.`,
      });
    }

    return res.status(200).json(applications);
  } catch (error) {
    return res.status(400).json({
      error,
      message: `Error occurred while fetching submissions with slug=${slug}.`,
    });
  }
}

export default withAuth(handler);
