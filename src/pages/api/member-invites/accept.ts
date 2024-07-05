import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import { prisma } from '@/prisma';

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  const { inviteId } = req.body;
  const userId = req.userId;

  try {
    const userInvite = await prisma.userInvites.findUnique({
      where: {
        id: inviteId,
      },
    });
    await prisma.userSponsors.create({
      data: {
        userId: userId as string,
        sponsorId: userInvite?.sponsorId || '',
        role: userInvite?.memberType,
      },
    });
    await prisma.user.update({
      where: {
        id: userId as string,
      },
      data: {
        currentSponsorId: userInvite?.sponsorId || '',
      },
    });
    return res.status(200).json({ accepted: true });
  } catch (error: any) {
    console.error(`User ${userId} unable to be accept invite`, error.message);
    return res.status(400).json({
      error,
      message: 'Error occurred while adding user to a sponsor',
    });
  }
}

export default withAuth(handler);
