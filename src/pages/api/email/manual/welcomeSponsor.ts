import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

import { kashEmail } from '@/constants/kashEmail';
import { WelcomeSponsorTemplate } from '@/features/emails';
import resendMail from '@/utils/resend';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const token = await getToken({ req });

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userEmail = token.email;

  if (!userEmail) {
    return res.status(400).json({ error: 'Invalid token' });
  }
  try {
    await resendMail.emails.send({
      from: kashEmail,
      to: [userEmail],
      subject: 'Welcome!',
      react: WelcomeSponsorTemplate(),
    });

    return res.status(200).json({ message: 'Ok' });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}
