import { type IncomingMessage } from 'http';
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

async function getRawBody(req: NextApiRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      resolve(data);
    });
    req.on('error', reject);
  });
}

const webhooks = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;

  switch (method) {
    case 'POST': {
      try {
        const payload = await getRawBody(req);
        const headers = req.headers as IncomingMessage['headers'] &
          WebhookRequiredHeaders;

        const event = webhook.verify(payload, headers) as WebhookEvent;

        if (event.type === 'email.bounced') {
          const last5Emails = await prisma.resendLogs.findMany({
            where: {
              email: event.data.to[0]!,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 5,
          });
          const allBounced =
            last5Emails.length === 5 &&
            last5Emails.every((email) => email.status === 'email.bounced');

          if (allBounced) {
            await prisma.blockedEmail.create({
              data: {
                email: event.data.to[0]!,
              },
            });
          }
        }

        await prisma.resendLogs.create({
          data: {
            email: event.data.to[0]!,
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
