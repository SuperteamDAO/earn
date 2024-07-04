import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import { prisma } from '@/prisma';

async function removeMember(req: NextApiRequestWithUser, res: NextApiResponse) {
  const { id } = req.body;
  const userId = req.userId;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId as string },
      select: {
        id: true,
        role: true,
        currentSponsor: {
          select: { id: true },
        },
      },
    });

    if (!user || !user.currentSponsor) {
      return res.status(400).json({ error: 'Unauthorized' });
    }

    const userSponsor = await prisma.userSponsors.findUnique({
      where: {
        userId_sponsorId: {
          userId: userId as string,
          sponsorId: user.currentSponsor.id,
        },
      },
      select: { role: true },
    });

    if (user.role !== 'GOD' && (!userSponsor || userSponsor.role !== 'ADMIN')) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const memberSponsor = await prisma.userSponsors.findUnique({
      where: {
        userId_sponsorId: {
          userId: id,
          sponsorId: user.currentSponsor.id,
        },
      },
      select: { role: true },
    });

    if (!memberSponsor) {
      return res.status(404).json({ error: 'Member not found' });
    }

    await prisma.userSponsors.delete({
      where: {
        userId_sponsorId: {
          userId: id,
          sponsorId: user.currentSponsor.id,
        },
      },
    });

    res.status(200).json({ message: 'Member removed successfully.' });
  } catch (error) {
    console.error('Error removing member:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuth(removeMember);
