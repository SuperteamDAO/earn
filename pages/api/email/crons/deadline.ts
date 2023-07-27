import { verifySignature } from '@upstash/qstash/nextjs';
import type { NextApiRequest, NextApiResponse } from 'next';

import { DeadlineEmailTemplate } from '@/components/emails/deadline';
import resendMail from '@/utils/resend';

async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const sampleEmailData = [
      {
        email: 'abhiakumar2002@gmail.com',
        name: 'John Doe',
      },
      {
        email: 'abhwshek@gmail.com',
        name: 'Jane Doe',
      },
    ];

    const sendEmailPromises = sampleEmailData.map((recipient) =>
      resendMail.emails.send({
        from: `Kash from Superteam <${process.env.SENDGRID_EMAIL}>`,
        to: [recipient.email],
        subject: 'Upcoming Bounty Close',
        react: DeadlineEmailTemplate({
          name: recipient.name,
        }),
      })
    );

    await Promise.all(sendEmailPromises);

    return res.status(200).json({ message: 'Emails sent successfully' });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}

export default verifySignature(handler);

export const config = {
  api: {
    bodyParser: false,
  },
};
