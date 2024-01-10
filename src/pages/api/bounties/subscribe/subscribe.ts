import console from 'console';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

import { prisma } from '@/prisma';

export default async function bounty(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const token = await getToken({ req });

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = token.id;

    if (!userId) {
      return res.status(400).json({ error: 'Invalid token' });
    }

    const subFound = await prisma.subscribeBounty.findFirst({
      where: {
        bountyId: req.body.bountyId,
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
    console.log('file: create.ts:31 ~ user ~ error:', error);
    return res.status(400).json({
      error,
      message: 'Error occurred while adding a new bounty.',
    });
  }
}
