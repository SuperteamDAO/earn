import type { NextApiRequest, NextApiResponse } from 'next';

import { generateCode } from '@/utils/helpers';
import sgMail from '@/utils/sendgrid';

export default async function send(req: NextApiRequest, res: NextApiResponse) {
  const { publicKey, email } = req.body;
  console.log('file: send.ts:8 ~ send ~ publicKey, email:', publicKey, email);
  try {
    const code = generateCode(publicKey as string);
    console.log('file: send.ts:10 ~ send ~ code:', code);
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
    console.log('file: send.ts:22 ~ send ~ msg:', msg);
    await sgMail.send(msg);
    console.log('sent successfully');
    res.status(200).json({ message: 'OTP sent successfully.' });
  } catch (error) {
    res.status(403).json({
      error,
      message: 'Error occured while adding a new user.',
    });
  }
}
