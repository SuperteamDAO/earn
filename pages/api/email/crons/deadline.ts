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
          gte: dayjs().add(1, 'day').toISOString(),
        },
      },
    });
    const bountiesWithDeadline = bounties.filter((bounty) => {
      return dayjs(bounty.deadline?.toISOString().split('T')[0]).isSame(
        dayjs().add(2, 'day').toISOString().split('T')[0]
      );
    });

    bountiesWithDeadline.forEach(async (bounty) => {
      const checkLogs = await prisma.emailLogs.findFirst({
        where: {
          bountyId: bounty.id,
          type: 'BOUNTY_CLOSE_DEADLINE',
        },
      });

      if (checkLogs) {
        return;
      }

      const subscribe = await prisma.subscribeBounty.findMany({
        where: {
          bountyId: bounty.id,
        },
        include: {
          User: true,
        },
      });

      const subEmail = subscribe.map((sub) => {
        return {
          email: sub.User.email,
          name: sub.User.firstName,
        };
      });
      const emailsSent: string[] = [];
      subEmail.forEach(async (e) => {
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
            link: `https://earn.superteam.fun/listings/bounties/${bounty.slug}`,
          },
        };
        await sgMail.send(msg);
        emailsSent.push(e.email);
      });
      await prisma.emailLogs.create({
        data: {
          type: 'BOUNTY_CLOSE_DEADLINE',
          bountyId: bounty.id,
        },
      });
    });

    return res.status(200).json({ message: 'Ok' });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}
