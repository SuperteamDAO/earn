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
          lte: dayjs().toISOString(),
        },
      },
    });

    const bountiesWithDeadline = bounties.filter((bounty) => {
      console.log(
        bounty.deadline?.toISOString().split('T')[0],
        dayjs().toISOString().split('T')[0]
      );
      return dayjs(bounty.deadline?.toISOString().split('T')[0]).isSame(
        dayjs().toISOString().split('T')[0]
      );
    });

    bountiesWithDeadline.forEach(async (bounty) => {
      const checkLogs = await prisma.emailLogs.findFirst({
        where: {
          bountyId: bounty.id,
          type: 'BOUNTY_REVIEW',
        },
      });

      if (checkLogs) {
        return;
      }
      const submissions = await prisma.submission.findMany({
        where: {
          listingId: bounty.id,
        },
        include: {
          user: true,
        },
      });
      const emails = submissions.map((submission) => {
        return {
          email: submission.user.email,
          name: submission.user.firstName,
        };
      });
      console.log(emails);

      const emailsSent: string[] = [];
      emails.forEach(async (e) => {
        if (emailsSent.includes(e.email)) {
          return;
        }
        const msg = {
          to: 'dhruvrajsinghsolanki161@gmail.com',
          from: {
            name: 'Kash from Superteam',
            email: process.env.SENDGRID_EMAIL as string,
          },
          templateId: process.env.SENDGRID_DEADLINE as string,
          dynamicTemplateData: {
            bountyName: bounty.title,
            name: e.name,
            link: `https://earn.superteam.fun/listings/bounties/${bounty.slug}`,
          },
        };
        await sgMail.send(msg);
        emailsSent.push(e.email);
      });
      await prisma.emailLogs.create({
        data: {
          type: 'BOUNTY_REVIEW',
          bountyId: bounty.id,
        },
      });
    });

    return res.status(200).json({ message: 'Ok', bountiesWithDeadline });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}
