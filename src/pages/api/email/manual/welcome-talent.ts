import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithUser } from '@/features/auth/types';
import { getPrivyToken } from '@/features/auth/utils/getPrivyToken';
import { withAuth } from '@/features/auth/utils/withAuth';
import { WelcomeTalentTemplate } from '@/features/emails/components/welcomeTalentTemplate';
import { pratikEmail, replyToEmail } from '@/features/emails/utils/fromEmails';
import { resend } from '@/features/emails/utils/resend';

export async function handler(
  req: NextApiRequestWithUser,
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

  const isBlocked = await prisma.blockedEmail.findUnique({
    where: { email: user.email },
  });

  if (isBlocked) {
    return res.status(400).json({ error: 'Blocked Email' });
  }

  try {
    logger.debug(`Sending welcome email to: ${user.email}`);
    await resend.emails.send({
      from: pratikEmail,
      to: [user.email],
      subject: 'Welcome to Superteam Earn!',
      react: WelcomeTalentTemplate(),
      replyTo: replyToEmail,
    });

    logger.info(`Welcome email sent successfully to: ${user.email}`);
    return res.status(200).json({ message: 'Ok' });
  } catch (error: any) {
    logger.error(
      `Error occurred while sending welcome email to ${user.email}: ${safeStringify(error)}`,
    );
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}

export default withAuth(handler);
