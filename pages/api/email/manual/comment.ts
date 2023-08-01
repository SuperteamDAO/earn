import type { NextApiRequest, NextApiResponse } from 'next';

import { CommentSponsorTemplate } from '@/components/emails/commentSponsorTemplate';
import { prisma } from '@/prisma';
import resendMail from '@/utils/resend';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.body;
  try {
    const listings = await prisma.bounties.findUnique({
      where: {
        id,
      },
      include: {
        poc: true,
      },
    });

    const pocUser = listings?.poc;

    if (!pocUser) {
      return res.status(400).json({ error: 'POC user not found.' });
    }

    await resendMail.emails.send({
      from: `Kash from Superteam <${process.env.SENDGRID_EMAIL}>`,
      to: [pocUser.email],
      subject: 'Comment Received on Your Superteam Earn Listing',
      react: CommentSponsorTemplate({
        name: pocUser.firstName!,
        bountyName: listings?.title,
        link: `https://earn.superteam.fun/listings/bounties/${listings?.slug}/?utm_source=superteamearn&utm_medium=email&utm_campaign=notifications`,
      }),
    });
    return res.status(200).json({ message: 'Ok' });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}
