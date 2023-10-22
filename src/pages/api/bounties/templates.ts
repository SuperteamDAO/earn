import type { BountyType } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function bounties(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const type = req.query.type as BountyType;

  try {
    const result = await prisma.bountiesTemplates.findMany({
      where: {
        isActive: true,
        isArchived: false,
        type,
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
