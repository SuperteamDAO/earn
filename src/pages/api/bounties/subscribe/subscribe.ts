import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import { prisma } from '@/prisma';

async function bounty(req: NextApiRequestWithUser, res: NextApiResponse) {
  try {
    const userId = req.userId;

    const subFound = await prisma.subscribeBounty.findFirst({
      where: {
        bountyId: req.body.bountyId,
        userId,
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
      return res.status(200).json(result);
    }
    const result = await prisma.subscribeBounty.create({
      data: {
        bountyId: req.body.bountyId,
        userId: userId as string,
      },
    });
    return res.status(200).json(result);
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      error,
      message: 'Error occurred while adding a new bounty.',
    });
  }
}

export default withAuth(bounty);
