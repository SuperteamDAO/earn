import axios from 'axios';
import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import { sendEmailNotification } from '@/features/emails';
import { prisma } from '@/prisma';

async function submission(req: NextApiRequestWithUser, res: NextApiResponse) {
  const userId = req.userId;

  const { listingId, link, tweet, otherInfo, eligibilityAnswers, ask } =
    req.body;

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
  try {
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
      });
    } catch (err) {
      console.log('Error in sending mail to User -', err);
    }

    try {
      await sendEmailNotification({
        type: 'submissionSponsor',
        id: listingId,
        userId: result?.listing?.pocId,
      });
    } catch (err) {
      console.log('Error in sending mail to Sponsor -', err);
    }

    try {
      if (process.env.NEXT_PUBLIC_VERCEL_ENV === 'production') {
        const zapierWebhookUrl = process.env.ZAPIER_SUBMISSION_WEBHOOK!;
        await axios.post(zapierWebhookUrl, result);
      }
    } catch (err) {
      console.log('Error with Zapier Webhook -', err);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      error,
      message: 'Error occurred while adding a new submission.',
    });
  }
}

export default withAuth(submission);
