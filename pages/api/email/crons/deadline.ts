import dayjs from 'dayjs';
import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';
import sgMail from '@/utils/sendgrid';

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const bounties = await prisma.bounties.findMany({
      where: {
        isPublished: true,
        isActive: true,
        isArchived: false,
        status: 'OPEN',
        deadline: {
          gte: dayjs().subtract(1, 'month').toISOString(),
        },
      },
    });
    const bountiesWithDeadline = bounties.filter((bounty) => {
      return dayjs(bounty.deadline).isSame(dayjs().add(2, 'day'));
    });

    bountiesWithDeadline.forEach(async (bounty) => {
      const submissions = await prisma.submission.findMany({
        where: {
          listingId: bounty.id,
        },
        include: {
          user: true,
        },
      });
      const emailsSent: string[] = [];
      const emails = submissions.map((submission) => {
        return {
          email: submission.user.email,
          name: submission.user.firstName,
        };
      });

      emails.forEach(async (e) => {
        if (emailsSent.includes(e.email)) {
          return;
        }
        const msg = {
          to: e.email,
          from: {
            name: 'Kash from Superteam',
            email: process.env.SENDGRID_EMAIL as string,
          },
          templateId: process.env.SENDGRID_DEADLINE as string,
          dynamicTemplateData: {
            name: bounty.title,
            link: `https://earn.superteam.fun/listings/bounties/${bounty.slug}/submission/${bounty.id}`,
          },
        };
        await sgMail.send(msg);
        emailsSent.push(e.email);
      });
    });

    return res.status(200).json({ message: 'Ok' });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}
