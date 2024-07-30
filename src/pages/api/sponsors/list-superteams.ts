import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';

async function listSuperteams(
  req: NextApiRequestWithUser,
  res: NextApiResponse,
) {
  const params = req.query;

  const userId = req.userId;
  const searchString = ('superteam ' + ' ' + params.searchString) as string;
  const take = params.take ? parseInt(params.take as string, 10) : 50;
  let finalSponsors = [];

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId as string,
      },
      select: {
        id: true,
        misconRole: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.misconRole === 'ZEUS') {
      const whereSearch = {
        name: {
          contains: searchString,
        },
        Hackathon: null,
      };

      const sponsorsList = await prisma.sponsors.findMany({
        where: {
          ...whereSearch,
        },
        take,
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
        },
        orderBy: {
          slug: 'asc',
        },
      });

      finalSponsors = sponsorsList.map((sponsor) => ({
        value: sponsor.id,
        label: sponsor.name,
        sponsor: {
          ...sponsor,
        },
      }));
      res.status(200).json(finalSponsors);
    } else {
      res.status(401).json({
        error: 'Not Allowed',
        message: 'Not Allowed',
      });
    }
  } catch (error: any) {
    logger.error(
      `Error fetching sponsors for user ${userId}: ${error.message}`,
    );
    res.status(500).json({
      error: error.message || 'Internal server error',
      message: 'Error occurred while fetching sponsors',
    });
  }
}

export default withAuth(listSuperteams);
