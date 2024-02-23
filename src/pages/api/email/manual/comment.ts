import type { NextApiRequest, NextApiResponse } from 'next';

import {
  CommentSponsorTemplate,
  getUnsubEmails,
  kashEmail,
  resend,
} from '@/features/emails';
import { prisma } from '@/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { id } = req.body;
  try {
    const unsubscribedEmails = await getUnsubEmails();
    const listings = await prisma.bounties.findUnique({
      where: {
        id,
      },
      include: {
        poc: true,
      },
    });

    const pocUser = listings?.poc;

    if (pocUser && !unsubscribedEmails.includes(pocUser.email)) {
      await resend.emails.send({
        from: kashEmail,
        to: [pocUser.email],
        subject: 'Comment Received on Your Superteam Earn Listing',
        react: CommentSponsorTemplate({
          name: pocUser.firstName!,
          bountyName: listings?.title,
          link: `https://earn.superteam.fun/listings/${listings?.type}/${listings?.slug}/?utm_source=superteamearn&utm_medium=email&utm_campaign=notifications`,
        }),
      });
    }

    return res.status(200).json({ message: 'Ok' });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}
