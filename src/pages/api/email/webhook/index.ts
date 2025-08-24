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

async function deleteEmailSettings(recipientEmail: string) {
  const users = await prisma.user.findMany({
    where: { email: recipientEmail },
  });

  if (users.length > 0) {
    await prisma.emailSettings.deleteMany({
      where: { userId: { in: users.map((u) => u.id) } },
    });
    console.log(
      `Deleted email settings for ${users.length} users with email ${recipientEmail}`,
    );
  } else {
    console.log(`No users found with email ${recipientEmail}`);
  }
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
    await deleteEmailSettings(recipientEmail);
  } else {
    console.log(
      `History for ${recipientEmail} does not meet unsubscribe criteria. No action taken.`,
    );
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

        // Convert email to lowercase to ensure consistency
        const normalizedEmail = recipientEmail.toLowerCase();

        if (event.type === 'email.bounced') {
          const { data } = await axios.post(
            `https://earn.superteam.fun/api/email/validate`,
            { email: normalizedEmail },
          );
          const isValid = data?.isValid ?? false;
          await handleEmailBounce(normalizedEmail, isValid);
        } else if (event.type === 'email.complained') {
          await deleteEmailSettings(normalizedEmail);
        }

        await prisma.resendLogs.create({
          data: {
            email: normalizedEmail,
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
