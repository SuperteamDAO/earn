import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

import {
  kashEmail,
  replyToEmail,
  resend,
  WelcomeSponsorTemplate,
} from '@/features/emails';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const token = await getToken({ req });

  if (!token) {
    logger.warn('Unauthorized request - No token provided');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userEmail = token.email;

  if (!userEmail) {
    logger.warn('Invalid token - No email found');
    return res.status(400).json({ error: 'Invalid token' });
  }

  const isBlocked = await prisma.blockedEmail.findUnique({
    where: { email: userEmail },
  });

  if (isBlocked) {
    return res.status(400).json({ error: 'Blocked Email' });
  }

  try {
    logger.debug(`Sending welcome email to: ${userEmail}`);
    await resend.emails.send({
      from: kashEmail,
      to: [userEmail],
      subject: 'Welcome!',
      react: WelcomeSponsorTemplate(),
      replyTo: replyToEmail,
    });

    logger.info(`Welcome email sent successfully to: ${userEmail}`);
    return res.status(200).json({ message: 'Ok' });
  } catch (error: any) {
    logger.error(
      `Error occurred while sending welcome email to ${userEmail}: ${safeStringify(error)}`,
    );
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}
