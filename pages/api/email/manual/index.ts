import type { NextApiRequest, NextApiResponse } from 'next';

import sgMail from '@/utils/sendgrid';

export async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { email } = req.body;
  try {
    const msg = {
      to: email,
      from: {
        name: 'Kash from Superteam',
        email: process.env.SENDGRID_EMAIL as string,
      },
      templateId: process.env.SENDGRID_INVITE_SPONSOR as string,
      dynamicTemplateData: {},
    };
    await sgMail.send(msg);
    res.status(200).json({ message: 'OTP sent successfully.' });
    return res.status(200).send({ clientRes: 'Hello' });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}
