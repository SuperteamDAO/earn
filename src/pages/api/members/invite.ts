import type { NextApiRequest, NextApiResponse } from 'next';

import { InviteMemberTemplate } from '@/components/emails/inviteMemberTemplate';
import { prisma } from '@/prisma';
import resendMail from '@/utils/resend';
import { getURL } from '@/utils/validUrl';

export default async function sendInvites(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { email, userId, sponsorId, memberType } = req.body;
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
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
      },
    });

    const result = await prisma.userInvites.create({
      data: {
        email,
        senderId: userId,
        sponsorId,
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

    res.status(200).json({ message: 'OTP sent successfully.' });
  } catch (error) {
    console.log('file: invite.ts:54 ~ error:', error);
    res.status(400).json({
      error,
      message: 'Error occurred while adding a new user.',
    });
  }
}
