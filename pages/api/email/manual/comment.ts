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
        sponsor: {
          include: {
            UserSponsors: {
              where: {
                role: 'ADMIN',
              },
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    const sponsorAdmin = listings?.sponsor.UserSponsors[0]?.user;

    if (!sponsorAdmin) {
      return res.status(400).json({ error: 'Sponsor admin not found.' });
    }

    await resendMail.emails.send({
      from: `Kash from Superteam <${process.env.SENDGRID_EMAIL}>`,
      to: [sponsorAdmin.email],
      subject: 'New Sponsor Comment',
      react: CommentSponsorTemplate({
        name: sponsorAdmin.firstName!,
        bountyName: listings?.title,
        link: `https://earn.superteam.fun/listings/bounties/${listings?.slug}`,
      }),
    });
    return res.status(200).json({ message: 'Ok' });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}
