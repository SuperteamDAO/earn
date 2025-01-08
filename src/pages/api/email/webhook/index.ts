import axios from 'axios';
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
  | 'email.delivered'
  | 'email.delivery_delayed'
  | 'email.complained'
  | 'email.bounced';

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

async function handleEmailBounce(recipientEmail: string, isValid: boolean) {
  if (!isValid) {
    await prisma.blockedEmail.create({
      data: {
        email: recipientEmail,
      },
    });
    return;
  }

  const last6Emails = await prisma.resendLogs.findMany({
    where: {
      email: recipientEmail,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 6,
  });

  const bouncedCount = last6Emails.filter(
    (email) => email.status === 'email.bounced',
  ).length;
  const delayedCount = last6Emails.filter(
    (email) => email.status === 'email.delivery_delayed',
  ).length;

  const lastThreeAreBounced = last6Emails
    .slice(0, 3)
    .every((email) => email.status === 'email.bounced');

  const highFailureTrend = bouncedCount + delayedCount >= 6;
  const allDelays = delayedCount === 6;
  const highBounceRatio = bouncedCount / last6Emails.length > 0.5;

  if (lastThreeAreBounced || highFailureTrend || allDelays || highBounceRatio) {
    await prisma.blockedEmail.create({
      data: {
        email: recipientEmail,
      },
    });
  }
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
          const { data } = await axios.post(
            `${process.env.NEXT_PUBLIC_BASE_URL}/api/email/validate`,
            { email: recipientEmail },
          );
          const isValid = data?.isValid || false;
          await handleEmailBounce(recipientEmail, isValid);
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
