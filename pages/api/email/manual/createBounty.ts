import type { NextApiRequest, NextApiResponse } from 'next';

import { NewBountyEmailTemplate } from '@/components/emails/newBountyTemplate';
import type { Skills } from '@/interface/skills';
import { prisma } from '@/prisma';
import resendMail from '@/utils/resend';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.body;
  try {
    const listing = await prisma.bounties.findUnique({
      where: {
        id,
      },
    });

    if (!listing) {
      return res.status(400).json({ error: 'Listing not found.' });
    }

    const skills = listing.skills as Skills;
    const search: any[] = [];
    skills.forEach(async (skill) => {
      search.push({
        notifications: {
          path: '$[*].label',
          array_contains: skill,
        },
      });
    });

    const users = await prisma.user.findMany({
      where: {
        OR: search,
      },
    });

    const email: {
      email: string;
      name: string;
    }[] = users.map((user) => {
      return {
        email: user.email,
        name: user.firstName as string,
      };
    });

    const emailsSent: string[] = [];

    email.forEach(async (e) => {
      if (emailsSent.includes(e.email)) {
        return;
      }

      await resendMail.emails.send({
        from: `Kash from Superteam <${process.env.SENDGRID_EMAIL}>`,
        to: [e.email],
        subject: 'New Bounty Created',
        react: NewBountyEmailTemplate({
          name: listing.title,
          link: `https://earn.superteam.fun/listings/bounties/${listing.slug}`,
        }),
      });

      console.log(e.email);
      emailsSent.push(e.email);
    });

    return res.status(200).json({ message: 'Ok' });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}
