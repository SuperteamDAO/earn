import dayjs from 'dayjs';
import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';
import sgMail from '@/utils/sendgrid';

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse
) {
  await prisma.user.findMany({
    where: {
      createdAt: {
        gte: dayjs().subtract(1, 'month').toISOString(),
      },
    },
  });
  try {
    const msg = {
      to: '',
      from: {
        name: 'Kash from Superteam',
        email: process.env.SENDGRID_EMAIL as string,
      },
      templateId: process.env.SENDGRID_REVIEW as string,
      dynamicTemplateData: {},
    };
    await sgMail.send(msg);

    return res.status(200).json({ message: 'Ok' });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}
