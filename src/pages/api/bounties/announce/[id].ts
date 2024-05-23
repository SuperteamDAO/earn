import type { NextApiResponse } from 'next';

import { tokenList } from '@/constants';
import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import { sendEmailNotification } from '@/features/emails';
import { type Rewards } from '@/features/listings';
import { prisma } from '@/prisma';
import { dayjs } from '@/utils/dayjs';
import { fetchTokenUSDValue } from '@/utils/fetchTokenUSDValue';

async function announce(req: NextApiRequestWithUser, res: NextApiResponse) {
  const userId = req.userId;
  const params = req.query;
  const id = params.id as string;
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId as string,
      },
    });

    const bounty = await prisma.bounties.findUnique({
      where: { id },
      include: {
        sponsor: true,
      },
    });

    if (
      !user ||
      !user.currentSponsorId ||
      bounty?.sponsorId !== user.currentSponsorId
    ) {
      return res
        .status(403)
        .json({ error: 'User does not have a current sponsor.' });
    }

    if (!bounty) {
      return res
        .status(404)
        .json({ message: `Bounty with id=${id} not found.` });
    }

    if (bounty?.isWinnersAnnounced) {
      return res.status(400).json({
        message: `Winners already announced for bounty with id=${id}.`,
      });
    }
    if (!bounty?.isActive) {
      return res.status(400).json({
        message: `Bounty with id=${id} is not active.`,
      });
    }
    const totalRewards = Object.keys(bounty?.rewards || {})?.length || 0;
    if (!!totalRewards && bounty?.totalWinnersSelected !== totalRewards) {
      return res.status(400).json({
        message: 'Please select all winners before publishing the results.',
      });
    }
    const deadline = dayjs().isAfter(bounty?.deadline)
      ? bounty?.deadline
      : dayjs().subtract(2, 'minute').toISOString();
    const result = await prisma.bounties.update({
      where: {
        id,
      },
      data: {
        isWinnersAnnounced: true,
        deadline,
        winnersAnnouncedAt: new Date().toISOString(),
      },
    });
    const rewards: Rewards = (bounty?.rewards || {}) as Rewards;
    const winners = await prisma.submission.findMany({
      where: {
        listingId: id,
        isWinner: true,
        isActive: true,
        isArchived: false,
      },
      take: 100,
      include: {
        user: true,
      },
    });

    const sortSubmissions = (
      a: (typeof winners)[0],
      b: (typeof winners)[0],
    ) => {
      const order = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5 };

      const aPosition = a.winnerPosition as keyof typeof order;
      const bPosition = b.winnerPosition as keyof typeof order;

      if (a.winnerPosition && b.winnerPosition) {
        return (
          (order[aPosition] || Number.MAX_VALUE) -
          (order[bPosition] || Number.MAX_VALUE)
        );
      }

      if (a.winnerPosition && !b.winnerPosition) {
        return -1;
      }

      if (!a.winnerPosition && b.winnerPosition) {
        return 1;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    };

    const sortedWinners = winners.sort(sortSubmissions);

    const extractedTags = sortedWinners
      .map((c, i) => {
        if (i > 0 && i === sortedWinners.length - 1)
          return `and @${c.user.username}`;
        else return `@${c.user.username}`;
      })
      .join(sortedWinners.length > 2 ? ', ' : ' ');

    let comment: string = 'Winners have been announced. ';
    const random = Math.floor(Math.random() * (2 - 1 + 1)) + 1;
    switch (random) {
      case 1:
        if (sortedWinners.length === 1) {
          comment = `Congratulations! ${extractedTags} has been announced as the winner!`;
        } else {
          comment = `Congratulations! ${extractedTags} have been announced as the winners!`;
        }
        break;
      case 2:
        if (bounty.type === 'bounty')
          comment = `Applaud ${extractedTags} for winning this Bounty`;
        if (bounty.type === 'project')
          comment = `Applaud ${extractedTags} for winning this Project`;
        break;
      default:
        break;
    }

    await prisma.comment.create({
      data: {
        authorId: user.id,
        listingId: id,
        message: comment,
        type: 'WINNER_ANNOUNCEMENT',
      },
    });

    const promises = [];
    let currentIndex = 0;

    const bountyToken = bounty.token;
    const tokenEntry = tokenList.find((t) => t.tokenSymbol === bountyToken);
    const coingeckoSymbol = tokenEntry?.coingeckoSymbol as string;

    let tokenUSDValue: any;

    if (bountyToken === 'USDC' || bountyToken === 'USDT') {
      tokenUSDValue = 1;
    } else {
      tokenUSDValue = await fetchTokenUSDValue(coingeckoSymbol);
    }

    let totalUSDRewarded = 0;

    while (currentIndex < winners?.length) {
      const amount: number = winners[currentIndex]?.winnerPosition
        ? Math.ceil(
            rewards[winners[currentIndex]?.winnerPosition as keyof Rewards] ||
              0,
          )
        : 0;

      const usdValue = amount * tokenUSDValue;
      totalUSDRewarded += usdValue;

      const amountWhere = {
        where: {
          id: winners[currentIndex]?.userId,
        },
        data: {
          totalEarnedInUSD: {
            increment: usdValue,
          },
        },
      };
      promises.push(
        prisma.submission.update({
          where: {
            id: winners[currentIndex]?.id,
          },
          data: {
            rewardInUSD: usdValue,
          },
        }),
      );
      promises.push(prisma.user.update(amountWhere));
      currentIndex += 1;
    }
    await Promise.all(promises);

    await prisma.sponsors.update({
      where: {
        id: bounty?.sponsorId,
      },
      data: {
        totalRewardedInUSD: {
          increment: totalUSDRewarded,
        },
      },
    });

    await sendEmailNotification({
      type: 'announceWinners',
      id,
    });

    if (bounty?.sponsor?.name.includes('Superteam')) {
      await sendEmailNotification({
        type: 'superteamWinners',
        id,
      });
    } else {
      console.log('Sponsor is not Superteam. Skipping sending winner emails.');
    }

    return res.status(200).json(result);
  } catch (error: any) {
    console.error(`User ${userId} unable to announce a listing`, error.message);
    return res.status(400).json({
      error,
      message: `Error occurred while announcing bounty with id=${id}.`,
    });
  }
}

export default withAuth(announce);
