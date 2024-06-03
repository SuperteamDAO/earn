import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import { prisma } from '@/prisma';

async function latestActiveSlug(
  req: NextApiRequestWithUser,
  res: NextApiResponse,
) {
  const userId = req.userId;

  const user = await prisma.user.findUnique({
    where: {
      id: userId as string,
    },
  });

  if (!user || !user.currentSponsorId) {
    return res
      .status(403)
      .json({ error: 'User does not have a current sponsor.' });
  }

  const sponsorId = user.currentSponsorId;

  const result = await prisma.bounties.findFirst({
    select: {
      slug: true,
    },
    where: {
      sponsorId,
      isPublished: true,
      isWinnersAnnounced: false,
      deadline: {
        gt: new Date().toISOString(),
      },
    },
    orderBy: [{ createdAt: 'desc' }],
  });
  if (!result || !result.slug) {
    return res.status(400).json({ err: 'No Active Bounty found' });
  }
  return res.status(200).json({ slug: result.slug });
}

export default withAuth(latestActiveSlug);
