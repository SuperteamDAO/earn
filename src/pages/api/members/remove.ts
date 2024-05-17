import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import { prisma } from '@/prisma';

async function removeMember(req: NextApiRequestWithUser, res: NextApiResponse) {
  const { id } = req.body;
  const userId = req.userId;

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId as string,
      },
      select: {
        id: true,
        currentSponsor: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!user || !user.currentSponsor) {
      return res.status(400).json({ error: 'Unauthorized' });
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
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuth(removeMember);
