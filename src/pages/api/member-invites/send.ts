import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import {
  InviteMemberTemplate,
  kashEmail,
  replyToEmail,
  resend,
} from '@/features/emails';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { getURL } from '@/utils/validUrl';

async function sendInvites(req: NextApiRequestWithUser, res: NextApiResponse) {
  const userId = req.userId;

  const { email, memberType } = req.body;
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId as string,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        currentSponsor: {
          select: {
            id: true,
            name: true,
          },
        },
        UserSponsors: true,
      },
    });

    if (!user || !user.currentSponsor) {
      return res.status(400).json({ error: 'Unauthorized' });
    }

    const result = await prisma.userInvites.create({
      data: {
        email,
        senderId: userId as string,
        sponsorId: user?.currentSponsor.id,
        memberType,
      },
    });

    await resend.emails.send({
      from: kashEmail,
      to: [email],
      subject: `${user?.firstName} has invited you to join ${user?.currentSponsor?.name}'s profile on Superteam Earn`,
      react: InviteMemberTemplate({
        sponsorName: user?.currentSponsor?.name || '',
        senderName: `${user?.firstName} ${user?.lastName}` || '',
        link: `${getURL()}signup?invite=${result.id}`,
      }),
      reply_to: replyToEmail,
    });

    return res.status(200).json({ message: 'OTP sent successfully.' });
  } catch (error: any) {
    logger.error(`User ${userId} unable to invite`, error.message);
    return res.status(400).json({
      error,
      message: 'Error occurred while adding a new user.',
    });
  }
}

export default withAuth(sendInvites);
