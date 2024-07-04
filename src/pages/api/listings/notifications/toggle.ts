import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import { prisma } from '@/prisma';

async function toggleSubscription(
  req: NextApiRequestWithUser,
  res: NextApiResponse,
) {
  try {
    const userId = req.userId;
    const { bountyId } = req.body;

    const subFound = await prisma.subscribeBounty.findFirst({
      where: { bountyId, userId },
    });

    let result;
    if (subFound) {
      result = await prisma.subscribeBounty.update({
        where: { id: subFound.id },
        data: { isArchived: !subFound.isArchived },
      });
    } else {
      result = await prisma.subscribeBounty.create({
        data: { bountyId, userId: userId as string },
      });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.log(error);
    return res
      .status(400)
      .json({ error, message: 'Error occurred while toggling subscription.' });
  }
}

export default withAuth(toggleSubscription);
