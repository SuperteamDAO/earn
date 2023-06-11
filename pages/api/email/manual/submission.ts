import type { MailDataRequired } from '@sendgrid/mail';
import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';
import sgMail from '@/utils/sendgrid';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { listingId, userId } = req.body;
  console.log(listingId, userId, '-------------------');
  try {
    const listing = await prisma.bounties.findFirst({
      where: {
        id: listingId as string,
      },
      include: {
        sponsor: {
          include: {
            UserSponsors: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });
    const user = await prisma.user.findFirst({
      where: {
        id: userId as string,
      },
    });
    console.log(user, listing);
    // const msg = {
    //   to: user?.email,
    //   from: {
    //     name: 'Kash from Superteam',
    //     email: process.env.SENDGRID_EMAIL as string,
    //   },
    //   templateId: process.env.SENDGRID_SUBMISSION_USER_TEMPLATE as string,
    //   dynamicTemplateData: {
    //     name: user?.firstName,
    //     bounty_name: listing?.title,
    //   },
    // };
    // await sgMail.send(msg);
    const msg1: MailDataRequired = {
      to: 'dhruvrajsinghsolanki161@gmail.com',
      from: {
        name: 'Kash from Superteam',
        email: process.env.SENDGRID_EMAIL as string,
      },
      templateId: process.env.SENDGRID_SUBMISSION_SPONSOR_TEMPLATE as string,
      dynamicTemplateData: {
        name: listing?.sponsor.UserSponsors[0]?.user.firstName,
        bounty_name: listing?.title,
        link: `https://earn.superteam.fun/dashboard/bounties/${listing?.slug}/submissions/`,
      },
    };
    const a = await sgMail.send(msg1);
    console.log(a, msg1);
    return res.status(200).json({ message: 'Ok' });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}
