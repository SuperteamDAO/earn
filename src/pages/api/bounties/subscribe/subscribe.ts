import console from 'console';
import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function bounty(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const subFound = await prisma.subscribeBounty.findFirst({
      where: {
        bountyId: req.body.bountyId,
        userId: req.body.userId,
      },
    });
    if (subFound) {
      const result = await prisma.subscribeBounty.update({
        where: {
          id: subFound.id,
        },
        data: {
          isArchived: false,
        },
      });
      res.status(200).json(result);
      return;
    }
    const result = await prisma.subscribeBounty.create({
      data: {
        bountyId: req.body.bountyId,
        userId: req.body.userId,
      },
    });
    res.status(200).json(result);
  } catch (error) {
    console.log('file: create.ts:31 ~ user ~ error:', error);
    res.status(400).json({
      error,
      message: 'Error occurred while adding a new bounty.',
    });
  }
}
