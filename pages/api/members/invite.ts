import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';
import sgMail from '@/utils/sendgrid';
import { getURL } from '@/utils/validUrl';

export default async function sendInvites(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { email, userId } = req.body;
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
      },
    });

    const msg = {
      to: email,
      from: {
        name: 'Kash from Superteam',
        email: process.env.SENDGRID_EMAIL as string,
      },
      templateId: process.env.SENDGRID_INVITE_SPONSOR as string,
      dynamicTemplateData: {
        sponsorName: user?.currentSponsor?.name,
        senderName: `${user?.firstName} ${user?.lastName}`,
        link: `${getURL()}/signup?invite=${result.id}`,
      },
    };
    await sgMail.send(msg);
    res.status(200).json({ message: 'OTP sent successfully.' });
  } catch (error) {
    console.log('file: invite.ts:54 ~ error:', error);
    res.status(400).json({
      error,
      message: 'Error occurred while adding a new user.',
    });
  }
}
