import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  const userId = req.userId;

  logger.debug(`Request body: ${safeStringify(req.body)}`);

  const user = await prisma.user.findUnique({
    where: {
      id: userId as string,
    },
  });

  if (!user) {
    logger.warn(`Unauthorized access attempt by user ID: ${userId}`);
    return res.status(400).json({ error: 'Unauthorized' });
  }

  const params = req.query;
  const slug = params.slug as string;
  const skip = params.skip ? parseInt(params.skip as string, 10) : 0;
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
        ],
      }
    : {};

  try {
    logger.info(
      `Fetching grant applications for slug: ${slug}, skip: ${skip}, take: ${take}, searchText: ${searchText}`,
    );

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

    if (!applications || applications.length === 0) {
      logger.info(`No submissions found for slug: ${slug}`);
      return res.status(404).json({
        message: `Submissions with slug=${slug} not found.`,
      });
    }

    logger.info(
      `Successfully fetched ${applications.length} applications for slug: ${slug}`,
    );
    return res.status(200).json(applications);
  } catch (error: any) {
    logger.error(
      `Error fetching submissions with slug=${slug}`,
      safeStringify(error),
    );
    return res.status(400).json({
      error: error.message,
      message: `Error occurred while fetching submissions with slug=${slug}.`,
    });
  }
}

export default withAuth(handler);
