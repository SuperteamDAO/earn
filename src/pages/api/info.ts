import { verifySignature } from '@upstash/qstash/dist/nextjs';
import dayjs from 'dayjs';
import type { NextApiRequest, NextApiResponse } from 'next';

import { InfoTemplate, kashEmail, resend } from '@/features/emails';
import { prisma } from '@/prisma';

const sevenDaysAgoDate = dayjs().subtract(7, 'day').toDate();

async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const totalUserCount = await prisma.user.count();

    const newUserCountInLastWeek = await prisma.user.count({
      where: {
        createdAt: {
          gte: sevenDaysAgoDate,
        },
      },
    });

    const totalTalentFilledUserCount = await prisma.user.count({
      where: {
        isTalentFilled: true,
      },
    });

    const newTalentFilledUserCountInLastWeek = await prisma.user.count({
      where: {
        createdAt: {
          gte: sevenDaysAgoDate,
        },
        isTalentFilled: true,
      },
    });

    const newBountiesCountInLastWeek = await prisma.bounties.count({
      where: {
        publishedAt: {
          gte: sevenDaysAgoDate,
        },
      },
    });

    const totalRewardAmountInLastWeek = await prisma.bounties.aggregate({
      _sum: {
        rewardAmount: true,
      },
      where: {
        publishedAt: {
          gte: sevenDaysAgoDate,
        },
      },
    });

    const totalRewardAmount = await prisma.bounties.aggregate({
      _sum: {
        rewardAmount: true,
      },
      where: {
        status: 'OPEN',
        isPublished: true,
      },
    });

    const totalRewardAmountResult = await prisma.user.aggregate({
      _sum: {
        totalEarnedInUSD: true,
      },
    });

    const totalTVEInLastWeek = await prisma.bounties.aggregate({
      _sum: {
        rewardAmount: true,
      },
      where: {
        winnersAnnouncedAt: {
          gte: sevenDaysAgoDate,
        },
      },
    });

    const totalTVE =
      Math.ceil((totalRewardAmountResult._sum.totalEarnedInUSD || 0) / 10) * 10;

    const info = {
      userSignUpsInLast7Days: newUserCountInLastWeek,
      totalUsersSignedUp: totalUserCount,
      newTalentProfilesFilledInLast7Days: newTalentFilledUserCountInLastWeek,
      totalTalentProfilesFilled: totalTalentFilledUserCount,
      newListingsPublishedInLast7Days: newBountiesCountInLastWeek,
      amountNewListingsPublishedInLast7Days:
        totalRewardAmountInLastWeek._sum.rewardAmount,
      amountListingsOpenAndPublishedOverall:
        totalRewardAmount._sum.rewardAmount,
      amountTVEAddedInLast7Days: totalTVEInLastWeek._sum.rewardAmount,
      totalTVE: totalTVE,
    };

    await resend.emails.send({
      from: kashEmail,
      to: ['pratik.dholani1@gmail.com', 'bodhiswattwac@gmail.com'],
      subject: 'Weekly Earn Stats',
      react: InfoTemplate({
        info: info,
      }),
    });

    return res.status(200).json({ message: 'Stats sent' });
  } catch (error: any) {
    return res.status(400).json({
      error: error.message,
    });
  }
}

export default verifySignature(handler);

export const config = {
  api: {
    bodyParser: false,
  },
};
