import { type IncomingMessage } from 'http';
import { buffer } from 'micro';
import type { NextApiRequest, NextApiResponse } from 'next';
import { type WebhookRequiredHeaders } from 'svix';

import { webhook } from '@/lib/webhook';
import { prisma } from '@/prisma';

export const config = {
  api: {
    bodyParser: false,
  },
};

type EmailType =
  | 'email.sent'
  | 'email.delivered'
  | 'email.delivery_delayed'
  | 'email.complained'
  | 'email.bounced'
  | 'email.opened'
  | 'email.clicked';

interface WebhookEvent {
  created_at: string;
  data: {
    created_at: string;
    email_id: string;
    from: string;
    subject: string;
    to: string[];
  };
  type: EmailType;
}

const webhooks = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;

  switch (method) {
    case 'POST': {
      try {
        const payload = (await buffer(req)).toString();
        const headers = req.headers as IncomingMessage['headers'] &
          WebhookRequiredHeaders;

        const event = webhook.verify(payload, headers) as WebhookEvent;

        const recipientEmail = event.data.to[0];

        if (!recipientEmail) {
          return res.status(400).json({ error: 'No recipient email found' });
        }

        if (event.type === 'email.bounced') {
          const last10Emails = await prisma.resendLogs.findMany({
            where: {
              email: recipientEmail,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 10,
          });

          const bouncedEmails = last10Emails.filter(
            (email) => email.status === 'email.bounced',
          );
          const delayedEmails = last10Emails.filter(
            (email) => email.status === 'email.delivery_delayed',
          );

          const hasEnoughBounced = bouncedEmails.length >= 5;
          const hasEnoughDelayed = delayedEmails.length >= 5;

          if (hasEnoughBounced && hasEnoughDelayed) {
            await prisma.blockedEmail.create({
              data: {
                email: recipientEmail,
              },
            });
          }
        }

        await prisma.resendLogs.create({
          data: {
            email: recipientEmail,
            subject: event.data.subject,
            status: event.type,
          },
        });

        return res.status(200).end();
      } catch (error) {
        return res.status(400).send(error);
      }
    }
    default:
      res.setHeader('Allow', ['POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
};

export default webhooks;
