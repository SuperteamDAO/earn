import type { NextApiRequest, NextApiResponse } from 'next';

import { OTPTemplate } from '@/components/emails/otpTemplate';
import { generateCode } from '@/utils/helpers';
import resendMail from '@/utils/resend';

export default async function send(req: NextApiRequest, res: NextApiResponse) {
  const { publicKey, email } = req.body;
  try {
    const serverTime = Date.now();
    const code = generateCode(publicKey as string, serverTime);
    await resendMail.emails.send({
      from: `Kash from Superteam <${process.env.SENDGRID_EMAIL}>`,
      to: [email],
      subject: 'OTP Verification for Superteam Earn',
      react: OTPTemplate({ code }),
    });
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
