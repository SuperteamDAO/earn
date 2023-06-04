import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function announce(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const params = req.query;
  const id = params.id as string;
  try {
    const bounty = await prisma.bounties.findFirst({
      where: {
        id,
      },
    });
    if (bounty?.isWinnersAnnounced) {
      res.status(400).json({
        message: `Winners already announced for bounty with id=${id}.`,
      });
      return;
    }
    if (!bounty?.isActive) {
      res.status(400).json({
        message: `Bounty with id=${id} is not active.`,
      });
      return;
    }
    const rewards = Object.keys(bounty?.rewards || {})?.length || 0;
    if (!!rewards && bounty?.totalWinnersSelected !== rewards) {
      res.status(400).json({
        message: 'Please select all winners before publishing the results.',
      });
      return;
    }
    const result = await prisma.bounties.update({
      where: {
        id,
      },
      data: {
        isWinnersAnnounced: true,
      },
    });
    res.status(200).json(result);
  } catch (error) {
    console.log('file: update.ts:21 ~ error:', error);
    res.status(400).json({
      error,
      message: `Error occurred while updating bounty with id=${id}.`,
    });
  }
}
