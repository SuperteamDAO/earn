import type { NextApiResponse } from 'next';

import { GrantStatus, status } from '@/interface/prisma/enums';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';

import { type NextApiRequestWithSponsor } from '@/features/auth/types';
import { withSponsorAuth } from '@/features/auth/utils/withSponsorAuth';

type BountyGrant = {
  type: 'bounty' | 'grant';
  id: string;
  title: string;
  slug: string;
  token: string | null;
  status: string;
  deadline: Date | null;
  isPublished: boolean;
  publishedAt: Date | null;
  rewards: any;
  rewardAmount: number | null;
  totalPaymentsMade: number;
  isWinnersAnnounced: boolean | null;
  maxRewardAsk: number | null;
  minRewardAsk: number | null;
  maxBonusSpots: number | null;
  compensationType: string | null;
  createdAt: Date;
  submissionCount: number;
  isFndnPaying: string;
};

async function handler(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  const userSponsorId = req.userSponsorId;
  try {
    const data: BountyGrant[] = await prisma.$queryRawUnsafe(
      `
      WITH combined_data AS (
        SELECT 
          b.type as type,
          b.id,
          b.title,
          b.slug,
          b.token,
          b.status,
          b.deadline,
          b.isPublished,
          b.publishedAt,
          b.rewards,
          b.rewardAmount,
          (SELECT COUNT(*) FROM Submission s WHERE s.listingId = b.id AND s.isPaid = 1) as totalPaymentsMade,
          b.maxBonusSpots,
          b.isWinnersAnnounced,
          b.maxRewardAsk,
          b.minRewardAsk,
          b.compensationType,
          b.createdAt,
          b.isFndnPaying,
          NULL as airtableId,
          CAST((SELECT COUNT(*) FROM Submission s WHERE s.listingId = b.id) AS SIGNED) as submissionCount
        FROM Bounties b
        WHERE b.isActive = true
        AND b.isArchived = false
        AND b.sponsorId = ?
        AND b.status <> ?
        
        UNION ALL
        
        SELECT 
          'grant' as type,
          g.id,
          g.title,
          g.slug,
          g.token,
          g.status,
          NULL as deadline,
          g.isPublished,
          NULL as publishedAt,
          NULL as rewards,
          NULL as rewardAmount,
          g.totalPaid as totalPaymentsMade,
          NULL as isWinnersAnnounced,
          g.minReward as minRewardAsk,
          g.maxReward as maxRewardAsk,
          NULL as compensationType,
          g.createdAt,
          NULL as isFndnPaying,
          g.airtableId,
NULL as maxBonusSpots,
          CAST((SELECT COUNT(*) FROM GrantApplication ga WHERE ga.grantId = g.id) AS SIGNED) as submissionCount
        FROM Grants g
        WHERE g.isActive = true
        AND g.isArchived = false
        AND g.sponsorId = ?
        AND g.status = ?
      )
      SELECT *
      FROM combined_data
      ORDER BY createdAt DESC
    `,
      userSponsorId,
      status.CLOSED,
      userSponsorId,
      GrantStatus.OPEN,
    );

    const serializedData = data.map((item) => ({
      ...item,
      submissionCount: Number(item.submissionCount),
      isFndnPaying: Boolean(Number(item.isFndnPaying)),
    }));

    logger.info(
      `Successfully fetched bounties and grants for sponsor ${userSponsorId}`,
    );
    res.status(200).json(serializedData);
  } catch (err: any) {
    logger.error(
      `Error fetching bounties and grants for sponsor ${userSponsorId}: ${err.message}`,
    );
    res
      .status(400)
      .json({ err: 'Error occurred while fetching bounties and grants.' });
  }
}

export default withSponsorAuth(handler);
