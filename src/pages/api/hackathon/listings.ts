import type { NextApiResponse } from 'next';

import { status } from '@/interface/prisma/enums';
import { prisma } from '@/prisma';

import { type NextApiRequestWithUser } from '@/features/auth/types';
import { withAuth } from '@/features/auth/utils/withAuth';

async function getHackathonListings(
  req: NextApiRequestWithUser,
  res: NextApiResponse,
) {
  const userId = req.userId;

  const user = await prisma.user.findUnique({
    where: {
      id: userId as string,
    },
  });

  if (!user || !user.currentSponsorId) {
    return res
      .status(403)
      .json({ error: 'User does not have a current sponsor.' });
  }

  const params = req.query;
  const searchText = params.searchText as string;
  const skip = params.take ? parseInt(params.skip as string, 10) : 0;
  const take = params.take ? parseInt(params.take as string, 10) : 15;
  const whereSearch = searchText
    ? {
        title: {
          contains: searchText,
        },
      }
    : {};
  try {
    const hackathon = await prisma.hackathon.findUnique({
      where: { id: user.hackathonId as string },
    });

    if (!hackathon) {
      return res.status(404).json({ error: 'Hackathon not found.' });
    }

    const whereQuery = {
      where: {
        isActive: true,
        isArchived: false,
        hackathonId: hackathon.id,
        status: status.OPEN,
        isPublished: true,
        ...whereSearch,
      },
    };
    const total = await prisma.bounties.count(whereQuery);
    const startDate = hackathon.startDate;
    const result = await prisma.bounties.findMany({
      ...whereQuery,
      skip: skip ?? 0,
      take: take ?? 15,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        title: true,
        type: true,
        slug: true,
        token: true,
        status: true,
        deadline: true,
        isPublished: true,
        rewards: true,
        rewardAmount: true,
        isWinnersAnnounced: true,
        sponsor: {
          select: {
            name: true,
            logo: true,
            isVerified: true,
            st: true,
          },
        },
        Hackathon: {
          select: {
            slug: true,
          },
        },
        Submission: {
          where: {
            OR: [
              {
                isActive: true,
                isArchived: false,
              },
              {
                isPaid: true,
              },
            ],
          },
          select: {
            isActive: true,
            isArchived: true,
            isPaid: true,
          },
        },
      },
    });
    const listings = result.map((bounty) => {
      const activeSubmissionsCount = bounty.Submission.filter(
        (sub) => sub.isActive && !sub.isArchived,
      ).length;

      const totalPaymentsMadeCount = bounty.Submission.filter(
        (sub) => sub.isPaid,
      ).length;

      const { Submission: _, ...bountyWithoutSubmissions } = bounty;

      return {
        ...bountyWithoutSubmissions,
        _count: {
          Submission: activeSubmissionsCount,
        },
        totalPaymentsMade: totalPaymentsMadeCount,
      };
    });
    res.status(200).json({ total, startDate, listings });
  } catch (err) {
    res.status(400).json({ err: 'Error occurred while fetching bounties.' });
  }
}

export default withAuth(getHackathonListings);
