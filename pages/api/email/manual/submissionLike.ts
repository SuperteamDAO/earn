import type { NextApiRequest, NextApiResponse } from 'next';

import { SubmissionLikeTemplate } from '@/components/emails/submissionLikeTemplate';
import { prisma } from '@/prisma';
import resendMail from '@/utils/resend';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.body;
  try {
    const submission = await prisma.submission.findUnique({
      where: {
        id,
      },
      include: {
        user: true,
        listing: true,
      },
    });

    await resendMail.emails.send({
      from: `Kash from Superteam <${process.env.SENDGRID_EMAIL}>`,
      to: [submission?.user.email as string],
      subject: 'People Love Your Superteam Earn Submission!',
      react: SubmissionLikeTemplate({
        name: submission?.user.firstName as string,
        bountyName: submission?.listing.title as string,
        link: `https://earn.superteam.fun/listings/bounties/${submission?.listing.slug}/?utm_source=superteamearn&utm_medium=email&utm_campaign=notifications`,
      }),
    });

    return res.status(200).json({ message: 'Ok' });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}
