import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

import { SubmissionSponsorTemplate } from '@/components/emails/submissionSponsorTemplate';
import { SubmissionTemplate } from '@/components/emails/submissionTemplate';
import { prisma } from '@/prisma';
import { getUnsubEmails } from '@/utils/airtable';
import resendMail from '@/utils/resend';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const token = await getToken({ req });

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = token.id;

  if (!userId) {
    return res.status(400).json({ error: 'Invalid token' });
  }

  const { listingId } = req.body;
  try {
    const unsubscribedEmails = await getUnsubEmails();
    const listing = await prisma.bounties.findFirst({
      where: {
        id: listingId as string,
      },
      include: {
        poc: true,
      },
    });
    const user = await prisma.user.findFirst({
      where: {
        id: userId as string,
      },
    });

    if (user?.email && user?.firstName && listing?.title) {
      await resendMail.emails.send({
        from: `Kash from Superteam <${process.env.RESEND_EMAIL}>`,
        to: [user?.email],
        subject: 'Submission Received!',
        react: SubmissionTemplate({
          name: user?.firstName,
          bountyName: listing?.title,
        }),
      });
    }

    const pocUser = listing?.poc;

    if (
      user?.email &&
      pocUser?.email &&
      listing?.title &&
      pocUser?.firstName &&
      !unsubscribedEmails.includes(pocUser.email)
    ) {
      await resendMail.emails.send({
        from: `Kash from Superteam <${process.env.RESEND_EMAIL}>`,
        to: [pocUser?.email],
        subject: 'New Bounty Submission Received',
        react: SubmissionSponsorTemplate({
          name: pocUser?.firstName,
          bountyName: listing?.title,
          link: `https://earn.superteam.fun/dashboard/bounties/${listing?.slug}/submissions/?utm_source=superteamearn&utm_medium=email&utm_campaign=notifications`,
        }),
      });
    }

    return res.status(200).json({ message: 'Ok' });
  } catch (error: any) {
    console.log(error);
    return res
      .status(500)
      .json({ error: `Something went wrong. ${error.message}` });
  }
}
