import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';

import { type NextApiRequestWithSponsor } from '@/features/auth/types';
import { withSponsorAuth } from '@/features/auth/utils/withSponsorAuth';

async function handler(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  const userId = req.userId;
  const params = req.query;

  const slug = params.slug as string;
  const isHackathon = params.isHackathon === 'true';

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId as string,
      },
    });

    if (!user) {
      logger.warn(`Unauthorized access attempt by user ${userId}`);
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const query = await prisma.submission.findMany({
      where: {
        listing: {
          slug,
          isActive: true,
          ...(isHackathon
            ? { hackathonId: user.hackathonId }
            : { sponsor: { id: req.userSponsorId } }),
        },
        isActive: true,
        isArchived: false,
      },
      include: {
        user: {
          select: {
            id: true,
            photo: true,
            firstName: true,
            lastName: true,
            username: true,
            email: true,
            walletAddress: true,
            twitter: true,
            discord: true,
            telegram: true,
            website: true,
            superteamLevel: true,
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
        listing: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const submissions = query.map((submission) => {
      const listingWinnings = submission.user.Submission.filter(
        (s) => s.isWinner && s.listing.isWinnersAnnounced,
      ).reduce((sum, submission) => sum + (submission.rewardInUSD || 0), 0);

      const grantWinnings = submission.user.GrantApplication.filter(
        (g) =>
          g.applicationStatus === 'Approved' ||
          g.applicationStatus === 'Completed',
      ).reduce(
        (sum, submission) => sum + (submission.approvedAmountInUSD || 0),
        0,
      );

      const totalEarnings = listingWinnings + grantWinnings;

      return { ...submission, totalEarnings };
    });

    const submissionsWithSortKey = submissions.map((submission) => {
      let sortKey = 0;
      if (submission.isWinner) {
        sortKey = Number(submission.winnerPosition);
      } else {
        if (submission.status === 'Approved') {
          sortKey = 100;
        } else if (submission.status === 'Rejected') {
          sortKey = 900;
        } else if (submission.label === 'Needs_Review') {
          sortKey = 150;
        } else if (submission.label === 'Shortlisted') {
          sortKey = 200;
        } else if (submission.label === 'Unreviewed') {
          sortKey = 300;
        } else if (submission.label === 'Mid_Quality') {
          sortKey = 400;
        } else if (submission.label === 'Low_Quality') {
          sortKey = 500;
        } else if (submission.label === 'Reviewed') {
          sortKey = 600;
        } else if (submission.label === 'Spam') {
          sortKey = 1000;
        } else {
          sortKey = 700;
        }
      }
      return { submission, sortKey };
    });

    submissionsWithSortKey.sort((a, b) => a.sortKey - b.sortKey);
    const sortedSubmissions = submissionsWithSortKey.map(
      (item) => item.submission,
    );

    logger.info(
      `Fetched ${sortedSubmissions.length} submissions for slug ${slug}`,
    );
    return res.status(200).json(sortedSubmissions);
  } catch (error: any) {
    logger.error(
      `Error occurred while fetching submissions for slug=${slug}: ${error.message}`,
    );
    return res.status(500).json({
      error: error.message,
      message: `Error occurred while fetching submissions with slug=${slug}.`,
    });
  }
}

export default withSponsorAuth(handler);
