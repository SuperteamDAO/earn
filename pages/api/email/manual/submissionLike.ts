import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';
import sgMail from '@/utils/sendgrid';
import { getURL } from '@/utils/validUrl';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id, userId } = req.body;
  try {
    const submission = await prisma.submission.findUnique({
      where: {
        id,
      },
      include: {
        user: true,
        listing: true,
      },
    });

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    const msg = {
      to: submission?.user.email,
      from: {
        name: 'Kash from Superteam',
        email: process.env.SENDGRID_EMAIL as string,
      },
      templateId: process.env.SENDGRID_LIKE_TEMPLATE as string,
      dynamicTemplateData: {
        name: user?.firstName,
        bounty_name: submission?.listing.title,
        link: `${getURL()}/listings/bounties/${
          submission?.listing.slug
        }/submission/${submission?.listing.id}`,
      },
    };
    await sgMail.send(msg);
    res.status(200).json({ message: 'Success.' });
    return res.status(200).send('Success');
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}
