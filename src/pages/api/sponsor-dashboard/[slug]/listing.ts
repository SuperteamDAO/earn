import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  const userId = req.userId;

  const user = await prisma.user.findUnique({
    where: {
      id: userId as string,
    },
  });

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const params = req.query;
  const slug = params.slug as string;
  const type = params.type as 'bounty' | 'project' | 'hackathon';
  try {
    const result = await prisma.bounties.findFirst({
      where: {
        slug,
        type,
        isActive: true,
        sponsor: {
          id: user.currentSponsorId!,
        },
      },
      include: {
        sponsor: { select: { name: true, logo: true } },
        poc: true,
        Submission: true,
        Hackathon: {
          select: {
            altLogo: true,
            startDate: true,
            name: true,
            description: true,
            slug: true,
            announceDate: true,
          },
        },
      },
    });

    if (!result) {
      return res.status(404).json({
        message: `Bounty with slug=${slug} not found.`,
      });
    }

    const totalSubmissions = result.Submission.length;
    const winnersSelected = result.Submission.filter(
      (sub) => sub.isWinner,
    ).length;
    const paymentsMade = result.Submission.filter((sub) => sub.isPaid).length;
    return res
      .status(200)
      .json({ ...result, totalSubmissions, winnersSelected, paymentsMade });
  } catch (error: any) {
    logger.error(`unable to view listing`, error.message);
    return res.status(400).json({
      error,
      message: `Error occurred while fetching bounty with slug=${slug}.`,
    });
  }
}

export default withAuth(handler);
