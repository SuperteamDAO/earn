import dayjs from 'dayjs';
import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';
import sgMail from '@/utils/sendgrid';

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const user = await prisma.user.findMany({
      where: {
        createdAt: {
          lte: dayjs().subtract(1, 'day').toISOString(),
        },
        isVerified: false,
      },
    });
    user.forEach(async (e) => {
      const msg = {
        to: e.email,
        from: {
          name: 'Kash from Superteam',
          email: process.env.SENDGRID_EMAIL as string,
        },
        templateId: process.env.SENDGRID_NO_VERIFIED as string,
        dynamicTemplateData: {
          name: e.firstName,
          link: `https://earn.superteam.fun`,
        },
      };
      await sgMail.send(msg);
    });

    return res.status(200).json({ message: 'Ok' });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}
