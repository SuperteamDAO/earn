import type { NextApiResponse } from 'next';
import { z } from 'zod';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithUser } from '@/features/auth/types';
import { withAuth } from '@/features/auth/utils/withAuth';
import { supportEmailTemplate } from '@/features/emails/components/supportEmailTemplate';
import { resend } from '@/features/emails/utils/resend';

const spamDisputeSchema = z.object({
  description: z.string().min(10),
  listingTitle: z.string().min(1),
  listingType: z.string().min(1),
});

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  const userId = req.userId;

  const user = await prisma.user.findUnique({
    where: { id: userId },
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
    const body = req.body;
    logger.debug(`Request body: ${safeStringify(req.body)}`);

    const { description, listingTitle, listingType } =
      spamDisputeSchema.parse(body);

    const subject = `${listingType} Spam Dispute - ${listingTitle}`;

    logger.info('Sending Spam Dispute Email');
    const { data, error } = await resend.emails.send({
      from: `Earn Spam Dispute <spam-dispute@superteamearn.com>`,
      to: ['support@superteamearn.com'],
      replyTo: user.email,
      subject,
      react: supportEmailTemplate({ from: user.email, subject, description }),
    });

    if (error) {
      console.error('Error sending email:', error);
      return res.status(500).json({ error: 'Failed to send email' });
    }

    return res.status(200).json({ success: true, messageId: data?.id });
  } catch (error) {
    logger.error('Error in spam dispute email API:', safeStringify(error));

    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuth(handler);
