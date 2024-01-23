import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

import { prisma } from '@/prisma';

export default async function accept(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const token = await getToken({ req });

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = token.id;

  if (!userId) {
    return res.status(400).json({ error: 'Invalid token' });
  }

  const { inviteId } = req.body;
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
  } catch (error) {
    console.log('file: create.ts:31 ~ user ~ error:', error);
    return res.status(400).json({
      error,
      message: 'Error occurred while adding user to a sponsor',
    });
  }
}
