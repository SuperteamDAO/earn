import { verifySignature } from '@upstash/qstash/dist/nextjs';
import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

const abbreviations = {
  SOL: 'solana',
  ISC: 'international-stable-currency',
  USDT: 'tether',
  STEP: 'step-finance',
  mSOL: 'marinade-staked-sol',
  UXD: 'uxd-stablecoin',
  RAY: 'raydium',
  SBR: 'saber',
  SLND: 'solend',
  C98: 'coin98',
  SRM: 'serum',
  DUST: 'dust-protocol',
  wSOL: 'wrapped-solana',
  FIDA: 'bonfida',
  ORCA: 'orca',
  HXRO: 'hxro',
};

function matchAbbreviations(data: any) {
  const matchedData: { [key: string]: any } = {};
  Object.entries(abbreviations).forEach(([abbr, name]) => {
    if (data[name]) {
      matchedData[abbr] = data[name].usd;
    }
  });
  return matchedData;
}

async function fetchCryptoPrices() {
  const cryptos = Object.values(abbreviations).join(',');
  try {
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price',
      {
        params: {
          ids: cryptos,
          vs_currencies: 'USD',
        },
      }
    );

    return response;
  } catch (error) {
    console.error('Error fetching crypto prices:', error);
    return null;
  }
}

async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const bountiesCount = await prisma.bounties.count({
      where: {
        isPublished: true,
      },
    });

    const cryptoPricesResponse = await fetchCryptoPrices();
    if (!cryptoPricesResponse) {
      return res.status(500).json({ error: 'Failed to fetch crypto prices' });
    }
    const tokenPrices = matchAbbreviations(cryptoPricesResponse.data);
    tokenPrices.USDC = 1;

    const bounties = await prisma.bounties.findMany({
      where: {
        OR: [
          {
            status: 'CLOSED',
          },
          {
            AND: [
              {
                status: 'OPEN',
              },
              {
                isWinnersAnnounced: true,
              },
            ],
          },
        ],
      },
      select: {
        rewardAmount: true,
        token: true,
      },
    });

    const totalRewardAmount = bounties.reduce((total, bounty) => {
      const tokenPrice = tokenPrices[bounty.token ?? ''] ?? 0;
      return total + (bounty.rewardAmount ?? 0) * tokenPrice;
    }, 0);

    const roundedTotalRewardAmount = Math.ceil(totalRewardAmount / 10) * 10;

    await prisma.total.updateMany({
      data: {
        count: bountiesCount,
        totalInUSD: roundedTotalRewardAmount,
      },
    });

    return res.status(200).json({
      'Total Value Earned': roundedTotalRewardAmount,
      'Total Bounties Listed': bountiesCount,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: 'An error occurred while fetching the total reward amount',
    });
  }
}

export default verifySignature(handler);

export const config = {
  api: {
    bodyParser: false,
  },
};
