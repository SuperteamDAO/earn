import axios from 'axios';
import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import { sendEmailNotification } from '@/features/emails';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

async function submission(req: NextApiRequestWithUser, res: NextApiResponse) {
  const userId = req.userId;
  const { listingId, link, tweet, otherInfo, eligibilityAnswers, ask } =
    req.body;
  logger.debug(`Request body: ${safeStringify(req.body)}`);

  try {
    const existingSubmission = await prisma.submission.findFirst({
      where: {
        userId,
        listingId,
      },
    });

    if (existingSubmission) {
      return res.status(400).json({
        message: 'Submission already exists for this user and listing.',
      });
    }

    const result = await prisma.submission.create({
      data: {
        userId: userId as string,
        listingId,
        link: link || '',
        tweet: tweet || '',
        otherInfo: otherInfo || '',
        eligibilityAnswers: eligibilityAnswers || undefined,
        ask: ask || null,
      },
      include: {
        user: true,
        listing: true,
      },
    });

    try {
      await sendEmailNotification({
        type: 'submissionTalent',
        id: listingId,
        userId: userId as string,
        triggeredBy: userId,
      });
    } catch (err) {
      logger.error('Error sending email to User:', err);
    }

    try {
      await sendEmailNotification({
        type: 'submissionSponsor',
        id: listingId,
        userId: result?.listing?.pocId,
        triggeredBy: userId,
      });
    } catch (err) {
      logger.error('Error sending email to Sponsor:', err);
    }

    try {
      if (process.env.NEXT_PUBLIC_VERCEL_ENV === 'production') {
        const zapierWebhookUrl = process.env.ZAPIER_SUBMISSION_WEBHOOK!;
        await axios.post(zapierWebhookUrl, result);
      }
    } catch (err) {
      logger.error('Error with Zapier Webhook:', err);
    }

    return res.status(200).json(result);
  } catch (error: any) {
    logger.error(`User ${userId} unable to submit: ${error.message}`);
    return res.status(400).json({
      error: error.message,
      message: `User ${userId} unable to submit, ${error.message}`,
    });
  }
}

export default withAuth(submission);
