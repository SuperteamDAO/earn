import type { NextApiRequest, NextApiResponse } from 'next';
import { getURL } from 'next/dist/shared/lib/utils';

import { prisma } from '@/prisma';
import sgMail from '@/utils/sendgrid';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { listingId, userId } = req.body;
  try {
    const listing = await prisma.bounties.findUnique({
      where: {
        id: listingId as string,
      },
    });
    const user = await prisma.user.findUnique({
      where: {
        id: userId as string,
      },
    });

    const msg = {
      to: user?.email,
      from: {
        name: 'Kash from Superteam',
        email: process.env.SENDGRID_EMAIL as string,
      },
      templateId: process.env.SENDGRID_SUBMISSION_USER_TEMPLATE as string,
      dynamicTemplateData: {
        name: user?.firstName,
        bounty_name: listing?.title,
        link: `${getURL()}`,
      },
    };
    const msg1 = {
      to: user?.email,
      from: {
        name: 'Kash from Superteam',
        email: process.env.SENDGRID_EMAIL as string,
      },
      templateId: process.env.SENDGRID_SUBMISSION_SPONSOR_TEMPLATE as string,
      dynamicTemplateData: {
        name: user?.firstName,
        bounty_name: listing?.title,
        link: `${getURL()}`,
      },
    };
    await sgMail.send(msg);
    await sgMail.send(msg1);
    return res.status(200).json({ message: 'Ok' });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}
