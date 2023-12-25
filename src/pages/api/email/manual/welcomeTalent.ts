import type { NextApiRequest, NextApiResponse } from 'next';

import { WelcomeTalentTemplate } from '@/components/emails/welcomeTalentTemplate';
import resendMail from '@/utils/resend';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { email } = req.body;
  try {
    await resendMail.emails.send({
      from: `Kash from Superteam <${process.env.RESEND_EMAIL}>`,
      to: [email],
      subject: 'Welcome to Superteam Earn!',
      react: WelcomeTalentTemplate(),
    });

    return res.status(200).json({ message: 'Ok' });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}
