import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

import { kashEmail } from '@/constants/kashEmail';
import { CommentSubmissionTemplate, getUnsubEmails } from '@/features/emails';
import { prisma } from '@/prisma';
import resendMail from '@/utils/resend';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const token = await getToken({ req });

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = token.id;

  if (!userId) {
    return res.status(400).json({ error: 'Invalid token' });
  }

  const { submissionId } = req.body;
  try {
    const unsubscribedEmails = await getUnsubEmails();
    const submission = await prisma.submission.findUnique({
      where: {
        id: submissionId,
      },
      include: {
        user: true,
        listing: true,
      },
    });
    const user = await prisma.user.findUnique({
      where: {
        id: userId as string,
      },
    });

    if (
      submission &&
      !unsubscribedEmails.includes(submission.user.email as string)
    ) {
      await resendMail.emails.send({
        from: kashEmail,
        to: [submission?.user.email as string],
        subject: 'Comment Received on Your Superteam Earn Submission',
        react: CommentSubmissionTemplate({
          name: submission?.user.firstName as string,
          bountyName: submission?.listing.title as string,
          personName: user?.firstName as string,
          link: `https://earn.superteam.fun/listings/${submission?.listing.type}/${submission?.listing.slug}/submission/${submission?.id}/?utm_source=superteamearn&utm_medium=email&utm_campaign=notifications`,
        }),
      });
    }

    return res.status(200).json({ message: 'Ok' });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}
