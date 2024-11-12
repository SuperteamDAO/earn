import { type NextApiRequest, type NextApiResponse } from 'next';

import { exclusiveSponsorData } from '@/constants';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { sponsor } = req.body;

  logger.debug(`Request body: ${safeStringify(req.body)}`);

  if (!sponsor) {
    logger.warn('Sponsor is required');
    return res.status(400).json({ message: 'Sponsor is required' });
  }

  const sponsorKey = sponsor.toLowerCase();

  if (!exclusiveSponsorData[sponsorKey]) {
    logger.warn(`Sponsor not found: ${sponsorKey}`);
    return res.status(404).json({ message: 'Sponsor not found' });
  }

  const sponsorInfo = exclusiveSponsorData[sponsorKey];

  try {
    logger.debug(`Fetching grants for sponsor: ${sponsorInfo?.title}`);
    const grants = await prisma.grants.findMany({
      where: {
        isPublished: true,
        isActive: true,
        isArchived: false,
        status: 'OPEN',
        ...(!!sponsorInfo?.showPrivates === true ? {} : { isPrivate: false }),
        sponsor: {
          name: sponsorInfo!.title,
        },
      },
      include: {
        sponsor: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            isVerified: true,
          },
        },
        _count: {
          select: {
            GrantApplication: {
              where: {
                OR: [
                  {
                    applicationStatus: 'Approved',
                  },
                  {
                    applicationStatus: 'Completed',
                  },
                ],
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const grantsWithTotalApplications = grants.map((grant) => ({
      ...grant,
      totalApplications:
        grant._count.GrantApplication + grant.historicalApplications,
    }));

    logger.info(
      `Successfully fetched grants for sponsor: ${sponsorInfo?.title}`,
    );
    res.status(200).json(grantsWithTotalApplications);
  } catch (error: any) {
    logger.error(
      `Error fetching grants for sponsor=${sponsorKey}: ${safeStringify(error)}`,
    );
    res.status(500).json({
      error: 'Internal server error',
      message: 'Error occurred while fetching grants',
    });
  }
}
