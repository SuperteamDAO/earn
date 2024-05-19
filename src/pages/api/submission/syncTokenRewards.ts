import axios from 'axios';
import dayjs from 'dayjs';
import type { NextApiRequest, NextApiResponse } from 'next';

import { tokenList } from '@/constants';
import { type Rewards } from '@/features/listings';
import { prisma } from '@/prisma';

const LIVECOINWATCH_API = 'https://api.livecoinwatch.com/coins/single/history';
const LIVECOINWATCH_API_KEY = process.env.LIVECOINWATCH_API_KEY;

const BATCH_SIZE = 100;

interface LiveCoinWatchSingleHistoryResponse {
  history: {
    data: number;
    rate: number;
  }[];
}

export default async function handler(_: NextApiRequest, res: NextApiResponse) {
  if (!LIVECOINWATCH_API_KEY)
    return res.status(500).json({ error: 'Missing API key' });
  let totalRecordsUpdated = 0;
  try {
    const usdStableCoins = ['USDC', 'USDT'];
    const noApiTokens = ['DHW', 'wSOL'];

    const firstBatch = await prisma.submission.findMany({
      take: BATCH_SIZE,
      where: {
        isWinner: true,
        listing: {
          isWinnersAnnounced: true,
        },
      },
      include: {
        listing: {
          select: {
            createdAt: true,
            publishedAt: true,
            token: true,
            rewards: true,
            isWinnersAnnounced: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
    if (firstBatch.length === 0)
      return res.status(500).json({ error: 'No submissions found' });

    async function setRewardInUSDForBatchTsx(batch: typeof firstBatch) {
      await prisma.$transaction(
        async (tsx) => {
          const updatePromises = batch.map(async (item) => {
            let rewardInUSD = 0;

            if (
              item.listing.isWinnersAnnounced &&
              item.winnerPosition &&
              item.isWinner &&
              !noApiTokens.includes(item?.listing?.token ?? '')
            ) {
              const rewards = item.listing.rewards as Rewards;
              const reward = rewards[item.winnerPosition as keyof Rewards];

              if (reward) {
                if (usdStableCoins.includes(item?.listing?.token ?? 'USDC')) {
                  rewardInUSD = reward;
                } else {
                  const livecoinwatchSymbol = tokenList.find(
                    (t) => t.tokenSymbol === item.listing.token,
                  );

                  if (livecoinwatchSymbol?.livecoinwatchSymbol) {
                    const referenceDate = item.listing.publishedAt
                      ? item.listing.publishedAt
                      : item.listing.createdAt;

                    const startOfReferenceDate = dayjs(referenceDate)
                      .startOf('day')
                      .valueOf();

                    const result =
                      await axios.post<LiveCoinWatchSingleHistoryResponse>(
                        LIVECOINWATCH_API,
                        {
                          currency: 'USD',
                          code: livecoinwatchSymbol.livecoinwatchSymbol,
                          start: startOfReferenceDate,
                          end: startOfReferenceDate,
                        },
                        {
                          headers: {
                            'content-type': 'application/json',
                            'x-api-key': LIVECOINWATCH_API_KEY,
                          },
                        },
                      );

                    if (result.data.history?.[0]?.rate) {
                      rewardInUSD = result.data.history[0].rate * reward;
                    }
                  }
                }
              }
            }

            return tsx.submission.update({
              where: {
                id: item.id,
              },
              data: {
                rewardInUSD,
              },
            });
          });

          await Promise.all(updatePromises);
        },
        { timeout: 1000000 },
      );
    }

    await setRewardInUSDForBatchTsx(firstBatch);
    totalRecordsUpdated = firstBatch.length;

    let prevId = firstBatch[BATCH_SIZE - 1]?.id;
    while (prevId) {
      const nextBatch = await prisma.submission.findMany({
        take: BATCH_SIZE,
        skip: 1,
        cursor: { id: prevId },
        where: {
          isWinner: true,
          listing: {
            isWinnersAnnounced: true,
          },
        },
        include: {
          listing: {
            select: {
              createdAt: true,
              publishedAt: true,
              token: true,
              rewards: true,
              isWinnersAnnounced: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      await setRewardInUSDForBatchTsx(nextBatch);
      prevId = nextBatch[BATCH_SIZE - 1]?.id;
      totalRecordsUpdated += nextBatch.length;
    }
    return res.status(200).json({
      message: 'Synced Succesfully',
      recordsUpdated: totalRecordsUpdated,
    });
  } catch (error) {
    return res.status(500).json({
      error,
      message: `Error occurred while syncing token reward.`,
    });
  }
}
