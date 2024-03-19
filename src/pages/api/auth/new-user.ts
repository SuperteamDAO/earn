import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

import { prisma } from '@/prisma';

export default async function newUser(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const token = await getToken({ req });

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = token.id;

    if (!userId) {
      return res.status(400).json({ error: 'Invalid token' });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId as string,
      },
    });

    const invite = await prisma.userInvites.findFirst({
      where: {
        email: user?.email,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const hasInvite = user && invite;

    if (!hasInvite) {
      return res
        .status(307)
        .redirect('/new?onboarding=true&loginState=signedIn');
    } else {
      await prisma.userSponsors.create({
        data: {
          userId: userId as string,
          sponsorId: invite?.sponsorId || '',
          role: invite?.memberType,
        },
      });
      await prisma.user.update({
        where: {
          id: userId as string,
        },
        data: {
          currentSponsorId: invite?.sponsorId,
        },
      });
      return res
        .status(307)
        .redirect('/dashboard/listings/?loginState=signedIn');
    }
  } catch (error) {
    return res.status(400).json({
      error,
      message: 'Error occurred while adding a new bounty.',
    });
  }
}
