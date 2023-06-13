import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';
import sgMail from '@/utils/sendgrid';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { userId, submissionId } = req.body;
  try {
    const submission = await prisma.submission.findUnique({
      where: {
        id: submissionId,
      },
      include: {
        user: true,
        listing: {
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
        },
      },
    });
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    const msg = {
      to: submission?.user.email as string,
      from: {
        name: 'Kash from Superteam',
        email: process.env.SENDGRID_EMAIL as string,
      },
      templateId: process.env.SENDGRID_COMMENT_TEMPLATE as string,
      dynamicTemplateData: {
        name: submission?.user.firstName,
        bounty_name: submission?.listing.title,
        personName: user?.firstName,
        link: `https://earn.superteam.fun/listings/bounties/${submission?.listing.slug}/submission/${submission?.id}`,
      },
    };
    console.log(msg);
    const sub = await sgMail.send(msg);
    console.log(sub, '----');
    return res.status(200).json({ message: 'Ok' });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}
