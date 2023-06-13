import type { NextApiRequest, NextApiResponse } from 'next';

import sgMail from '@/utils/sendgrid';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { email, name } = req.body;
  try {
    const msg = {
      to: email,
      from: {
        name: 'Kash from Superteam',
        email: process.env.SENDGRID_EMAIL as string,
      },
      templateId: process.env.SENDGRID_WELCOME_SPONSOR as string,
      dynamicTemplateData: {
        name,
        link: 'https://earn.superteam.fun',
      },
    };
    await sgMail.send(msg);
    return res.status(200).json({ message: 'Ok' });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}
