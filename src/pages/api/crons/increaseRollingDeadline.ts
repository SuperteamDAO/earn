import { verifySignature } from '@upstash/qstash/dist/nextjs';
import dayjs from 'dayjs';
import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const bounties = await prisma.bounties.findMany({
      where: {
        type: 'permissioned',
        applicationType: 'rolling',
        status: 'OPEN',
      },
    });

    const today = dayjs();
    const twoDaysFromNow = today.add(2, 'day');

    const updates = bounties.map(async (bounty) => {
      if (bounty.deadline) {
        const deadline = dayjs(bounty.deadline);

        if (deadline.isBefore(twoDaysFromNow)) {
          const newDeadline = deadline.add(30, 'day');
          return prisma.bounties.update({
            where: {
              id: bounty.id,
            },
            data: {
              deadline: newDeadline.toDate(),
            },
          });
        }
      }
      return Promise.resolve(null);
    });

    await Promise.all(updates);

    res.status(200).json({ message: 'Deadlines extended successfully.' });
  } catch (error) {
    console.error('Error extending deadlines:', error);
    res
      .status(500)
      .json({ message: 'An error occurred while extending deadlines.' });
  }
}

export default verifySignature(handler);

export const config = {
  api: {
    bodyParser: false,
  },
};
