import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { type GrantApplicationWhereInput } from '@/prisma/models/GrantApplication';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithSponsor } from '@/features/auth/types';
import { checkGrantSponsorAuth } from '@/features/auth/utils/checkGrantSponsorAuth';
import { withSponsorAuth } from '@/features/auth/utils/withSponsorAuth';

async function handler(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  logger.debug(`Request body: ${safeStringify(req.body)}`);

  const params = req.query;
  const slug = params.slug as string;

  try {
    logger.info(`Fetching grant tranches for slug: ${slug}`);

    const grant = await prisma.grants.findUnique({
      where: { slug },
    });

    if (!grant) {
      logger.warn(`Grant with slug=${slug} not found`);
      return res.status(404).json({
        message: `Grant with slug=${slug} not found.`,
      });
    }

    const { error } = await checkGrantSponsorAuth(req.userSponsorId, grant.id);
    if (error) {
      return res.status(error.status).json({ error: error.message });
    }

    const grantApplicationWhere: GrantApplicationWhereInput = {
      grant: {
        slug,
        isActive: true,
        sponsorId: req.userSponsorId!,
      },
    };
    const totalCount = await prisma.grantTranche.count({
      where: {
        GrantApplication: grantApplicationWhere,
      },
    });

    const query = await prisma.grantTranche.findMany({
      where: {
        GrantApplication: grantApplicationWhere,
      },
      include: {
        GrantApplication: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                photo: true,
                walletAddress: true,
                discord: true,
                username: true,
                twitter: true,
                telegram: true,
                website: true,
                Submission: {
                  select: {
                    isWinner: true,
                    rewardInUSD: true,
                    listing: {
                      select: {
                        isWinnersAnnounced: true,
                      },
                    },
                  },
                },
                GrantApplication: {
                  select: {
                    approvedAmountInUSD: true,
                    applicationStatus: true,
                  },
                },
              },
            },
            grant: true,
          },
        },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });

    const applications = query.map((application) => {
      const listingWinnings =
        application.GrantApplication.user.Submission.filter(
          (s) => s.isWinner && s.listing.isWinnersAnnounced,
        ).reduce((sum, submission) => sum + (submission.rewardInUSD || 0), 0);

      const grantWinnings =
        application.GrantApplication.user.GrantApplication.filter(
          (g) =>
            g.applicationStatus === 'Approved' ||
            g.applicationStatus === 'Completed',
        ).reduce(
          (sum, application) => sum + (application.approvedAmountInUSD || 0),
          0,
        );

      const totalEarnings = listingWinnings + grantWinnings;

      return { ...application, totalEarnings };
    });

    if (!applications || applications.length === 0) {
      logger.info(`No submissions found for slug: ${slug}`);
    }
    logger.info(
      `Successfully fetched ${applications.length} applications for slug: ${slug}`,
    );
    return res.status(200).json({
      data: applications,
      count: totalCount,
    });
  } catch (error: any) {
    logger.error(
      `Error fetching submissions with slug=${slug}: ${safeStringify(error)}`,
    );
    return res.status(400).json({
      error: error.message,
      message: `Error occurred while fetching submissions with slug=${slug}.`,
    });
  }
}

export default withSponsorAuth(handler);
