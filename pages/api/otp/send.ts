import type { NextApiRequest, NextApiResponse } from 'next';

import { generateCode } from '@/utils/helpers';
import sgMail from '@/utils/sendgrid';

export default async function send(req: NextApiRequest, res: NextApiResponse) {
  const { publicKey, email } = req.body;
  try {
    const serverTime = Date.now();
    const code = generateCode(publicKey as string, serverTime);
    const msg = {
      to: email,
      from: {
        name: 'Kash from Superteam',
        email: process.env.SENDGRID_EMAIL as string,
      },
      templateId: process.env.SENDGRID_VERIFICATION_SPONSOR as string,
      dynamicTemplateData: {
        totp: JSON.stringify(code),
      },
    };
    await sgMail.send(msg);
    res
      .status(200)
      .json({ message: 'OTP sent successfully.', time: serverTime });
  } catch (error) {
    res.status(400).json({
      error,
      message: 'Error occurred while adding a new user.',
    });
  }
}
