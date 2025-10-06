import type { NextApiRequest, NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { getPrivyToken } from '@/features/auth/utils/getPrivyToken';
import { WelcomeSponsorTemplate } from '@/features/emails/components/welcomeSponsorTemplate';
import { pratikEmail, replyToEmail } from '@/features/emails/utils/fromEmails';
import { resend } from '@/features/emails/utils/resend';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const privyDid = await getPrivyToken(req);

  if (!privyDid) {
    logger.warn('Unauthorized request - No token provided');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = await prisma.user.findUnique({
    where: { privyDid },
    select: { email: true },
  });

  if (!user) {
    logger.warn('Invalid token - No email found');
    return res.status(400).json({ error: 'Invalid token' });
  }

  // Convert email to lowercase to ensure consistency
  const normalizedEmail = user.email.toLowerCase();

  const isBlocked = await prisma.blockedEmail.findUnique({
    where: { email: normalizedEmail },
  });

  if (isBlocked) {
    return res.status(400).json({ error: 'Blocked Email' });
  }

  try {
    logger.debug(`Sending welcome email to: ${normalizedEmail}`);
    await resend.emails.send({
      from: pratikEmail,
      to: [normalizedEmail],
      subject: 'Welcome!',
      react: WelcomeSponsorTemplate(),
      replyTo: replyToEmail,
    });

    logger.info(`Welcome email sent successfully to: ${normalizedEmail}`);
    return res.status(200).json({ message: 'Ok' });
  } catch (error: any) {
    logger.error(
      `Error occurred while sending welcome email to ${normalizedEmail}: ${safeStringify(error)}`,
    );
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}
