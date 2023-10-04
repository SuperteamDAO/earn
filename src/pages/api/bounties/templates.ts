import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function bounties(
  _req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const result = await prisma.bountiesTemplates.findMany({
      where: {
        isActive: true,
        isArchived: false,
      },
      take: 20,
      include: {
        Bounties: {
          select: {
            sponsor: true,
          },
        },
      },
    });
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ err: 'Error occurred while fetching bounties.' });
  }
}
