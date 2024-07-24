import { verifySignature } from '@upstash/qstash/nextjs';
import dayjs from 'dayjs';
import type { NextApiRequest, NextApiResponse } from 'next';

import { discordDueForWinners } from '@/features/discord';
import { prisma } from '@/prisma';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  try {
    const fiveDaysAgo = dayjs().subtract(5, 'day');
    const twoMonthsAgo = dayjs().subtract(2, 'month');
    const startOfFiveDaysAgo = dayjs(fiveDaysAgo).startOf('day').toDate();
    const startOfTwoMonthsAgo = dayjs(twoMonthsAgo).startOf('day').toDate();

    const bounties = await prisma.bounties.findMany({
      where: {
        isWinnersAnnounced: false,
        deadline: {
          lte: startOfFiveDaysAgo,
          gte: startOfTwoMonthsAgo,
        },
        sponsor: {
          NOT: undefined,
        },
        sponsorId: {
          not: undefined,
        },
        isPublished: true,
        isActive: true,
        isPrivate: false,
        hackathonprize: false,
        isArchived: false,
        Hackathon: null,
      },
      include: {
        sponsor: true,
      },
      orderBy: {
        deadline: 'asc',
      },
    });
    console.log('bounties - ', bounties.length);
    if (bounties.length === 0) {
      return res
        .status(400)
        .json({ message: 'No bounties 5 day past deadline' });
    }
    await discordDueForWinners(bounties);
    // console.log('fiveDaysAgo bounties - ', bounties)
    // console.log('bounties length - ', bounties.length)
    return res.send('done');
  } catch (err) {
    console.error('Error sending discord message for 5 day past deadline', err);
    return res.status(500).json({
      message: 'Error sending discord message for 5 day past deadline',
    });
  }
}

export default verifySignature(handler);
