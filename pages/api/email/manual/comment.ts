import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';
import sgMail from '@/utils/sendgrid';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id, userId } = req.body;
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

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    const msg = {
      to: listings?.sponsor.UserSponsors[0]?.user.email,
      from: {
        name: 'Kash from Superteam',
        email: process.env.SENDGRID_EMAIL as string,
      },
      templateId: process.env.SENDGRID_INVITE_SPONSOR as string,
      dynamicTemplateData: {
        name: listings?.sponsor.UserSponsors[0]?.user.firstName,
        bounty_name: listings?.title,
        personName: user?.firstName,
        link: `https://https://earn.superteam.fun/listings/bounties/${listings?.slug}`,
      },
    };
    await sgMail.send(msg);
    return res.status(200).json({ message: 'Ok' });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}
