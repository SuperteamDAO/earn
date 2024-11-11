import crypto from 'crypto';
import type { NextApiResponse } from 'next';

import {
  type NextApiRequestWithSponsor,
  withSponsorAuth,
} from '@/features/auth';
import {
  InviteMemberTemplate,
  kashEmail,
  replyToEmail,
  resend,
} from '@/features/emails';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';
import { getURL } from '@/utils/validUrl';

async function sendInvites(
  req: NextApiRequestWithSponsor,
  res: NextApiResponse,
) {
  const userId = req.userId;

  logger.debug(`Request body: ${safeStringify(req.body)}`);
  logger.debug(`User ID: ${userId}`);

  const { email, memberType } = req.body;

  if (!email || !memberType) {
    logger.warn('Email and member type are required');
    return res
      .status(400)
      .json({ error: 'Email and member type are required.' });
  }

  try {
    logger.debug(`Fetching user details for user ID: ${userId}`);
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
            name: true,
            id: true,
          },
        },
        UserSponsors: true,
      },
    });

    if (!user || !user.currentSponsor) {
      logger.warn(`Unauthorized access attempt by user ID: ${userId}`);
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (req.role !== 'GOD' && user.UserSponsors[0]?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const isBlocked = await prisma.blockedEmail.findUnique({
      where: { email: email },
    });

    if (isBlocked) {
      return res.status(400).json({ error: 'Blocked Email' });
    }

    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const token = crypto.randomBytes(32).toString('hex');

    logger.debug(`Creating user invite for email: ${email}`);
    await prisma.userInvites.create({
      data: {
        email,
        senderId: userId as string,
        sponsorId: user.currentSponsor.id,
        memberType,
        token,
        expires,
      },
    });

    logger.debug(`Sending invite email to: ${email}`);
    await resend.emails.send({
      from: kashEmail,
      to: [email],
      subject: `${user.firstName} has invited you to join ${user.currentSponsor.name}'s profile on Solar Earn`,
      react: InviteMemberTemplate({
        sponsorName: user.currentSponsor.name,
        senderName: `${user.firstName} ${user.lastName}`,
        link: `${getURL()}signup?invite=${token}`,
      }),
      replyTo: replyToEmail,
    });

    logger.info(`Invite sent successfully to ${email} by user ${userId}`);
    return res.status(200).json({ message: 'Invite sent successfully.' });
  } catch (error: any) {
    logger.error(
      `User ${userId} unable to send invite: ${safeStringify(error)}`,
    );
    return res.status(500).json({
      error: error.message,
      message: 'Error occurred while sending the invite.',
    });
  }
}

export default withSponsorAuth(sendInvites);
