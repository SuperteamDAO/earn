import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';

async function bounty(req: NextApiRequestWithUser, res: NextApiResponse) {
  try {
    const userId = req.userId;

    const hackathon = await prisma.hackathon.findUnique({
      where: {
        slug: req.body.slug,
      },
    });
    if (!hackathon)
      return res.status(400).json({
        message: 'Hackathon not found',
      });
    const subFound = await prisma.subscribeHackathon.findFirst({
      where: {
        hackathonId: hackathon.id,
        userId,
      },
    });
    if (subFound) {
      const result = await prisma.subscribeHackathon.update({
        where: {
          id: subFound.id,
        },
        data: {
          isArchived: false,
        },
      });
      return res.status(200).json(result);
    }
    const result = await prisma.subscribeHackathon.create({
      data: {
        hackathonId: hackathon.id,
        userId: userId as string,
      },
    });
    return res.status(200).json(result);
  } catch (error) {
    logger.error(error);
    return res.status(400).json({
      error,
      message: 'Error occurred while adding a new bounty.',
    });
  }
}

export default withAuth(bounty);
