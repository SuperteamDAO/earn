// import { verifySignature } from '@upstash/qstash/dist/nextjs';
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
    const startOfDay = dayjs(fiveDaysAgo).startOf('day').toDate();
    const endOfDay = dayjs(fiveDaysAgo).endOf('day').toDate();

    const bounties = await prisma.bounties.findMany({
      where: {
        isWinnersAnnounced: false,
        deadline: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        sponsor: true,
      },
    });
    await discordDueForWinners(bounties);
    // console.log('fiveDaysAgo bounties - ', bounties)
    // console.log('bounties length - ', bounties.length)
    res.send('done');
  } catch (err) {
    console.error('Error sending discord message for 5 day past deadline', err);
    res.status(500).json({
      message: 'Error sending discord message for 5 day past deadline',
    });
  }
}

export default handler;
