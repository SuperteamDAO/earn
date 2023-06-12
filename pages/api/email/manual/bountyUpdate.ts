import type { MailDataRequired } from '@sendgrid/mail';
import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';
import sgMail from '@/utils/sendgrid';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.body;
  try {
    const notifyPeople = await prisma.subscribeBounty.findMany({
      include: {
        User: true,
        Bounties: true,
      },
      where: {
        bountyId: id,
      },
    });

    const email: {
      email: string;
      name: string;
    }[] = notifyPeople.map((user) => {
      return {
        email: user.User.email,
        name: user.User.firstName as string,
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
        templateId: process.env.SENDGRID_BOUNTY_UPDATE as string,
        dynamicTemplateData: {
          name: e.name,
          bountyName: notifyPeople[0]?.Bounties?.title,
          link: `https://earn.superteam.fun/listings/bounties/${notifyPeople[0]?.Bounties?.slug}`,
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
