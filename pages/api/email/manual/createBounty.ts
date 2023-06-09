import type { MailDataRequired } from '@sendgrid/mail';
import type { NextApiRequest, NextApiResponse } from 'next';

import type { Skills } from '@/interface/skills';
import { prisma } from '@/prisma';
import sgMail from '@/utils/sendgrid';

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
    skills.forEach((skill) => {
      search.push({
        path: '$[*].skills',
        array_contains: skill.skills,
      });
    });
    const users = await prisma.user.findMany({
      where: {
        AND: search,
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
    email.map(async (e) => {
      if (emailsSent.includes(e.email)) {
        return;
      }

      const msg: MailDataRequired = {
        to: e.email,
        from: {
          name: 'Kash from Superteam',
          email: process.env.SENDGRID_EMAIL as string,
        },
        templateId: process.env.SENDGRID_INVITE_SPONSOR as string,
        dynamicTemplateData: {
          name: e.name,
          link: `https://https://earn.superteam.fun/listings/bounties/${listing.slug}/submission/${listing.id}`,
        },
      };
      await sgMail.send(msg);
      emailsSent.push(e.email);
    });
    return res.status(200).json({ message: 'Ok' });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}
