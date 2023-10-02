import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function accept(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { inviteId, userId = '' } = req.body;
  console.log('file: accept.ts:10 ~ inviteId:', inviteId);
  try {
    const userInvite = await prisma.userInvites.findUnique({
      where: {
        id: inviteId,
      },
    });
    console.log('file: accept.ts:17 ~ userInvite:', userInvite);
    await prisma.userSponsors.create({
      data: {
        userId,
        sponsorId: userInvite?.sponsorId || '',
        role: userInvite?.memberType,
      },
    });
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        currentSponsorId: userInvite?.sponsorId || '',
      },
    });
    res.status(200).json({ accepted: true });
  } catch (error) {
    console.log('file: create.ts:31 ~ user ~ error:', error);
    res.status(400).json({
      error,
      message: 'Error occurred while adding user to a sponsor',
    });
  }
}
