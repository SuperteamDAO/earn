import { CreditEventType } from '@prisma/client';
import type { NextApiResponse } from 'next';
import { z } from 'zod';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithUser } from '@/features/auth/types';
import { withAuth } from '@/features/auth/utils/withAuth';
import { addCreditDispute } from '@/features/credits/utils/allocateCredits';
import { supportEmailTemplate } from '@/features/emails/components/supportEmailTemplate';
import { resend } from '@/features/emails/utils/resend';

const spamDisputeSchema = z.object({
  description: z.string().min(10),
  listingTitle: z.string().min(1),
  listingType: z.string().min(1),
  submissionId: z.string().min(1),
});

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  const userId = req.userId;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, id: true },
  });

  if (!user) {
    logger.warn('Invalid token - No email found');
    return res.status(400).json({ error: 'Invalid token' });
  }

  try {
    const body = req.body;
    logger.debug(`Request body: ${safeStringify(req.body)}`);

    const { description, listingTitle, listingType, submissionId } =
      spamDisputeSchema.parse(body);

    const existingDispute = await prisma.creditLedger.findFirst({
      where: {
        submissionId,
        userId,
        type: {
          in: [
            CreditEventType.SPAM_DISPUTE,
            CreditEventType.GRANT_SPAM_DISPUTE,
          ],
        },
      },
    });

    if (existingDispute) {
      logger.warn(`Duplicate dispute attempt for submission ${submissionId}`);
      return res.status(400).json({
        error: 'A dispute has already been submitted for this submission',
      });
    }

    const spamEntry = await prisma.creditLedger.findFirst({
      where: {
        submissionId,
        userId,
        type: {
          in: [
            CreditEventType.SPAM_PENALTY,
            CreditEventType.GRANT_SPAM_PENALTY,
          ],
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!spamEntry) {
      logger.warn(`No spam penalty found for submission ${submissionId}`);
      return res.status(400).json({
        error: 'No spam penalty found for this submission',
      });
    }

    const daysSinceSpamEntry = Math.floor(
      (Date.now() - spamEntry.createdAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysSinceSpamEntry > 7) {
      logger.warn(`Dispute deadline passed for submission ${submissionId}`);
      return res.status(400).json({
        error:
          'The deadline for disputing this spam penalty has passed (7 days)',
      });
    }

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

    const creditEventType =
      listingType === 'GRANT'
        ? CreditEventType.GRANT_SPAM_DISPUTE
        : CreditEventType.SPAM_DISPUTE;

    await addCreditDispute(user?.id, creditEventType, submissionId);

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
