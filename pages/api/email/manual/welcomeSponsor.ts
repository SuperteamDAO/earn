import type { NextApiRequest, NextApiResponse } from 'next';

import { WelcomeSponsorTemplate } from '@/components/emails/welcomeSponsorTemplate';
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
      subject: 'Welcome!',
      react: WelcomeSponsorTemplate(),
    });

    return res.status(200).json({ message: 'Ok' });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}
