import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import { prisma } from '@/prisma';

async function grantApplication(
  req: NextApiRequestWithUser,
  res: NextApiResponse,
) {
  const userId = req.userId;

  const { grantId, answers, ask, discordId, twitterId, walletAddress } =
    req.body;

  try {
    const result = await prisma.grantApplication.create({
      data: {
        userId: userId as string,
        grantId,
        answers: answers,
        ask: ask || null,
        discordId,
        twitterId,
        walletAddress,
      },
      include: {
        user: true,
        grant: true,
      },
    });

    return res.status(200).json(result);
  } catch (error: any) {
    console.error(`User ${userId} unable to apply`, error.message);
    return res.status(400).json({
      error,
      message: 'Error occurred while adding a new grant application.',
    });
  }
}

export default withAuth(grantApplication);
