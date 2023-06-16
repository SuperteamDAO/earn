import dayjs from 'dayjs';
import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';
import sgMail from '@/utils/sendgrid';

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    console.log('cron trigger');
    const user = await prisma.user.findMany({
      where: {
        createdAt: {
          lte: dayjs().subtract(2, 'day').toISOString(),
        },
        currentSponsorId: null,
        isTalentFilled: false,
      },
    });

    user.forEach(async (e) => {
      const logCheck = await prisma.emailLogs.findFirst({
        where: {
          type: 'NO_ACTIVITY',
          email: e.email,
        },
      });
      if (logCheck) {
        console.log('Already sent email', e.email);
        return;
      }
      const msg = {
        to: 'dhruvrajsinghsolanki161@gmail.com',
        from: {
          name: 'Kash from Superteam',
          email: process.env.SENDGRID_EMAIL as string,
        },
        templateId: process.env.SENDGRID_NO_VERIFIED as string,
        dynamicTemplateData: {
          name: e.firstName,
          link: `https://earn.superteam.fun/?utm_source=superteamearn&utm_medium=email&utm_campaign=makeprofile`,
        },
      };
      const [ress] = await sgMail.send(msg);
      console.log(e.email, ress.statusCode);
      if (ress.statusCode === 202) {
        await prisma.emailLogs.create({
          data: {
            type: 'NO_ACTIVITY',
            email: e.email,
          },
        });
      }
    });
    return res.status(200).json({ message: 'Ok' });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}
