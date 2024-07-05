import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import { prisma } from '@/prisma';

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  const userId = req.userId;

  const user = await prisma.user.findUnique({
    where: {
      id: userId as string,
    },
  });

  if (!user) {
    return res.status(400).json({ error: 'Unauthorized' });
  }

  const params = req.query;
  const slug = params.slug as string;
  try {
    const result = await prisma.grants.findFirst({
      where: {
        slug,
        sponsor: {
          id: user.currentSponsorId!,
        },
      },
      include: { sponsor: true, poc: true, GrantApplication: true },
    });

    if (!result) {
      return res.status(404).json({
        message: `Grant with slug=${slug} not found.`,
      });
    }

    const totalApplications = result.GrantApplication.length;

    return res.status(200).json({
      ...result,
      totalApplications,
    });
  } catch (error) {
    res.status(400).json({
      error,
      message: `Error occurred while fetching grant with slug=${slug}.`,
    });
  }
}

export default withAuth(handler);
