import axios from 'axios';
import type { NextApiResponse } from 'next';

import { tokenList } from '@/constants';
import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import { sendEmailNotification } from '@/features/emails';
import { type Rewards } from '@/features/listings';
import { prisma } from '@/prisma';
import { dayjs } from '@/utils/dayjs';

async function fetchTokenUSDValue(symbol: string) {
  try {
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price',
      {
        params: {
          ids: symbol,
          vs_currencies: 'USD',
        },
      },
    );
    return response.data[symbol].usd;
  } catch (error) {
    console.error('Error fetching token value from CoinGecko:', error);
    return 0;
  }
}

async function announce(req: NextApiRequestWithUser, res: NextApiResponse) {
  const params = req.query;
  const id = params.id as string;
  try {
    const userId = req.userId;

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
      userId: userId as string,
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
  } catch (error) {
    return res.status(400).json({
      error,
      message: `Error occurred while announcing bounty with id=${id}.`,
    });
  }
}

export default withAuth(announce);
