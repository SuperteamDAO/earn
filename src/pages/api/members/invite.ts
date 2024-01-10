import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

import { InviteMemberTemplate } from '@/components/emails/inviteMemberTemplate';
import { prisma } from '@/prisma';
import resendMail from '@/utils/resend';
import { getURL } from '@/utils/validUrl';

export default async function sendInvites(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const token = await getToken({ req });

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = token.id;

  if (!userId) {
    return res.status(400).json({ error: 'Invalid token' });
  }

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

    await resendMail.emails.send({
      from: `Kash from Superteam <${process.env.RESEND_EMAIL}>`,
      to: [email],
      subject: `${user?.firstName} has invited you to join ${user?.currentSponsor?.name}'s profile on Superteam Earn`,
      react: InviteMemberTemplate({
        sponsorName: user?.currentSponsor?.name || '',
        senderName: `${user?.firstName} ${user?.lastName}` || '',
        link: `${getURL()}signup?invite=${result.id}`,
      }),
    });

    return res.status(200).json({ message: 'OTP sent successfully.' });
  } catch (error) {
    console.log('file: invite.ts:54 ~ error:', error);
    return res.status(400).json({
      error,
      message: 'Error occurred while adding a new user.',
    });
  }
}
