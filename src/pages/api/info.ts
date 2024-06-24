import dayjs from 'dayjs';
import updateLocale from 'dayjs/plugin/updateLocale';
import utc from 'dayjs/plugin/utc';
import type { NextApiRequest, NextApiResponse } from 'next';

import { alertsEmail, InfoTemplate, resend } from '@/features/emails';
import { prisma } from '@/prisma';

dayjs.extend(utc);
dayjs.extend(updateLocale);
dayjs.updateLocale('en', {
  weekStart: 1,
});

const startOfLastWeek = dayjs
  .utc()
  .subtract(1, 'week')
  .startOf('week')
  .toDate();
const endOfLastWeek = dayjs.utc().startOf('week').toDate();

const formatDate = (date: Date) => dayjs(date).format('DD-MM-YY HH:mm');

const lastWeek = {
  gte: startOfLastWeek,
  lte: endOfLastWeek,
};

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const totalUserCount = await prisma.user.count();

    const newUserCountInLastWeek = await prisma.user.count({
      where: {
        createdAt: lastWeek,
      },
    });

    const totalTalentFilledUserCount = await prisma.user.count({
      where: {
        isTalentFilled: true,
      },
    });

    const newTalentFilledUserCountInLastWeek = await prisma.user.count({
      where: {
        createdAt: lastWeek,
        isTalentFilled: true,
      },
    });

    const newBountiesCountInLastWeek = await prisma.bounties.count({
      where: {
        publishedAt: lastWeek,
        isPublished: true,
      },
    });

    const bountiesInLastWeek = await prisma.bounties.findMany({
      where: {
        publishedAt: lastWeek,
        isPublished: true,
      },
      select: {
        usdValue: true,
        minRewardAsk: true,
        maxRewardAsk: true,
        compensationType: true,
        isWinnersAnnounced: true,
      },
    });

    let totalRewardAmountInLastWeek = 0;

    for (const bounty of bountiesInLastWeek) {
      if (
        bounty.compensationType === 'range' &&
        !bounty.isWinnersAnnounced &&
        !!bounty.maxRewardAsk &&
        !!bounty.minRewardAsk
      ) {
        const averageReward = (bounty.minRewardAsk + bounty.maxRewardAsk) / 2;
        totalRewardAmountInLastWeek += averageReward || 0;
      } else {
        totalRewardAmountInLastWeek += bounty.usdValue || 0;
      }
    }

    const openBounties = await prisma.bounties.findMany({
      where: {
        status: 'OPEN',
        isPublished: true,
      },
      select: {
        usdValue: true,
        minRewardAsk: true,
        maxRewardAsk: true,
        compensationType: true,
        isWinnersAnnounced: true,
      },
    });

    let totalRewardAmount = 0;

    for (const bounty of openBounties) {
      if (
        bounty.compensationType === 'range' &&
        !bounty.isWinnersAnnounced &&
        !!bounty.maxRewardAsk &&
        !!bounty.minRewardAsk
      ) {
        const averageReward = (bounty.minRewardAsk + bounty.maxRewardAsk) / 2;
        totalRewardAmount += averageReward || 0;
      } else {
        totalRewardAmount += bounty.usdValue || 0;
      }
    }

    const totalRewardAmountResult = await prisma.bounties.aggregate({
      _sum: {
        usdValue: true,
      },
      where: {
        isWinnersAnnounced: true,
        isPublished: true,
        status: 'OPEN',
      },
    });

    const totalTVEInLastWeek = await prisma.bounties.aggregate({
      _sum: {
        usdValue: true,
      },
      where: {
        winnersAnnouncedAt: lastWeek,
        isPublished: true,
      },
    });

    const totalTVE =
      Math.ceil((totalRewardAmountResult._sum.usdValue || 0) / 10) * 10;

    const info = {
      userSignUpsInLast7Days: newUserCountInLastWeek,
      totalUsersSignedUp: totalUserCount,
      newTalentProfilesFilledInLast7Days: newTalentFilledUserCountInLastWeek,
      totalTalentProfilesFilled: totalTalentFilledUserCount - 289,
      newListingsPublishedInLast7Days: newBountiesCountInLastWeek,
      amountNewListingsPublishedInLast7Days: totalRewardAmountInLastWeek,
      amountListingsOpenAndPublishedOverall: totalRewardAmount,
      amountTVEAddedInLast7Days: totalTVEInLastWeek._sum.usdValue,
      totalTVE: totalTVE,
    };

    await resend.emails.send({
      from: alertsEmail,
      to: ['pratik.dholani1@gmail.com', 'bodhiswattwac@gmail.com'],
      subject: `Weekly Earn Stats (from ${formatDate(startOfLastWeek)} to ${formatDate(endOfLastWeek)}`,
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

// export default verifySignature(handler);

// export const config = {
//   api: {
//     bodyParser: false,
//   },
// };
