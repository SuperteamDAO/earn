import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

import {
  alertsEmail,
  replyToEmail,
  resend,
  WelcomeSponsorTemplate,
} from '@/features/emails';

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
    await resend.emails.send({
      from: alertsEmail,
      to: [userEmail],
      subject: 'Welcome!',
      react: WelcomeSponsorTemplate(),
      reply_to: replyToEmail,
    });

    return res.status(200).json({ message: 'Ok' });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}
