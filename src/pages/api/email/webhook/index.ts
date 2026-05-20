import { type IncomingMessage } from 'http';
import { buffer } from 'micro';
import type { NextApiRequest, NextApiResponse } from 'next';
import { type Prisma } from '@/generated/prisma/client';
import { type WebhookRequiredHeaders } from 'svix';

import logger from '@/lib/logger';
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
  | 'email.bounced'
  | 'email.opened'
  | 'email.clicked';

interface WebhookEvent {
  created_at: string;
  data: {
    bounce?: {
      message?: string;
      subType?: string;
      type?: 'Permanent' | 'Transient' | 'Undetermined' | string;
    };
    created_at: string;
    email_id: string;
    from: string;
    subject: string;
    tags?: Record<string, string>;
    to: string[];
  };
  type: EmailType;
}

type BounceCategory =
  | 'content_rejected'
  | 'dead_domain'
  | 'full_inbox'
  | 'hard_bounce'
  | 'temp_provider';

const SOFT_BOUNCE_REASONS = new Set([
  'bounced - dead domain',
  'bounced - inbox full',
  'bounced - transient',
]);

const HARD_BOUNCE_REASON = 'bounced - hard';

async function deleteEmailSettings(
  tx: Prisma.TransactionClient,
  recipientEmail: string,
) {
  logger.info(
    `Deleting all EmailSettings for users with email ${recipientEmail}`,
  );

  const users = await tx.user.findMany({
    where: { email: recipientEmail },
    select: { id: true },
  });

  if (users.length > 0) {
    for (const user of users) {
      await tx.emailSettings.deleteMany({
        where: { userId: user.id },
      });
      logger.info(`Deleted EmailSettings for user ID ${user.id}`);
    }
  } else {
    logger.info(`No users found with email ${recipientEmail}`);
  }
}

function normalizeEventDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function truncateDiagnosticCode(message?: string) {
  if (!message) {
    return null;
  }

  return message.slice(0, 191);
}

function classifyBounce(event: WebhookEvent): {
  category: BounceCategory;
  diagnosticCode: string | null;
  shouldIncrement: boolean;
  suppressImmediately: boolean;
} {
  const bounce = event.data.bounce;
  const diagnosticCode = truncateDiagnosticCode(bounce?.message);
  const fingerprint = `${bounce?.subType ?? ''} ${bounce?.message ?? ''}`.toLowerCase();

  if (
    fingerprint.includes('content rejected') ||
    fingerprint.includes('detected your message as spam') ||
    fingerprint.includes('marked as spam')
  ) {
    return {
      category: 'content_rejected',
      diagnosticCode,
      shouldIncrement: false,
      suppressImmediately: false,
    };
  }

  if (
    fingerprint.includes('mailbox full') ||
    fingerprint.includes('out of storage space') ||
    fingerprint.includes('inbox is full') ||
    fingerprint.includes('quota exceeded')
  ) {
    return {
      category: 'full_inbox',
      diagnosticCode,
      shouldIncrement: true,
      suppressImmediately: false,
    };
  }

  if (
    fingerprint.includes('no mx') ||
    fingerprint.includes('no such domain') ||
    fingerprint.includes('domain does not exist')
  ) {
    return {
      category: 'dead_domain',
      diagnosticCode,
      shouldIncrement: true,
      suppressImmediately: true,
    };
  }

  if (bounce?.type === 'Permanent') {
    return {
      category: 'hard_bounce',
      diagnosticCode,
      shouldIncrement: false,
      suppressImmediately: true,
    };
  }

  return {
    category: 'temp_provider',
    diagnosticCode,
    shouldIncrement: true,
    suppressImmediately: false,
  };
}

function getSuppressionReason(category: BounceCategory) {
  switch (category) {
    case 'dead_domain':
      return 'bounced - dead domain';
    case 'full_inbox':
      return 'bounced - inbox full';
    case 'hard_bounce':
      return HARD_BOUNCE_REASON;
    default:
      return 'bounced - transient';
  }
}

async function upsertBlockedEmail(
  tx: Prisma.TransactionClient,
  recipientEmail: string,
  reason: string,
) {
  await tx.blockedEmail.upsert({
    where: { email: recipientEmail },
    update: { reason },
    create: {
      email: recipientEmail,
      reason,
    },
  });
}

async function handleBounceEvent(
  tx: Prisma.TransactionClient,
  event: WebhookEvent,
  recipientEmail: string,
) {
  const eventDate = normalizeEventDate(event.created_at);
  const bounce = classifyBounce(event);

  if (bounce.category === 'content_rejected') {
    await tx.emailBounceLog.upsert({
      where: { email: recipientEmail },
      update: {
        bounceType: bounce.category,
        diagnosticCode: bounce.diagnosticCode,
        lastBounceAt: eventDate,
      },
      create: {
        email: recipientEmail,
        bounceType: bounce.category,
        diagnosticCode: bounce.diagnosticCode,
        lastBounceAt: eventDate,
      },
    });

    logger.warn(
      `Content rejection recorded for ${recipientEmail}. Not auto-suppressing recipient.`,
    );
    return;
  }

  if (bounce.suppressImmediately) {
    const suppressionReason = getSuppressionReason(bounce.category);

    await tx.emailBounceLog.upsert({
      where: { email: recipientEmail },
      update: {
        bounceType: bounce.category,
        diagnosticCode: bounce.diagnosticCode,
        consecutiveBounces: bounce.category === 'hard_bounce' ? 0 : 1,
        lastBounceAt: eventDate,
        suppressedAt: eventDate,
      },
      create: {
        email: recipientEmail,
        bounceType: bounce.category,
        diagnosticCode: bounce.diagnosticCode,
        consecutiveBounces: bounce.category === 'hard_bounce' ? 0 : 1,
        lastBounceAt: eventDate,
        suppressedAt: eventDate,
      },
    });

    await upsertBlockedEmail(tx, recipientEmail, suppressionReason);
    return;
  }

  const previousLog = await tx.emailBounceLog.findUnique({
    where: { email: recipientEmail },
  });

  const nextConsecutiveBounces =
    bounce.shouldIncrement === false
      ? previousLog?.consecutiveBounces ?? 0
      : (previousLog?.consecutiveBounces ?? 0) + 1;

  const shouldSuppress = nextConsecutiveBounces >= 2;
  const suppressionReason = getSuppressionReason(bounce.category);

  await tx.emailBounceLog.upsert({
    where: { email: recipientEmail },
    update: {
      bounceType: bounce.category,
      diagnosticCode: bounce.diagnosticCode,
      consecutiveBounces: nextConsecutiveBounces,
      lastBounceAt: eventDate,
      suppressedAt: shouldSuppress ? eventDate : null,
    },
    create: {
      email: recipientEmail,
      bounceType: bounce.category,
      diagnosticCode: bounce.diagnosticCode,
      consecutiveBounces: nextConsecutiveBounces,
      lastBounceAt: eventDate,
      suppressedAt: shouldSuppress ? eventDate : null,
    },
  });

  if (shouldSuppress) {
    await upsertBlockedEmail(tx, recipientEmail, suppressionReason);
  }
}

async function handleDeliveredEvent(
  tx: Prisma.TransactionClient,
  recipientEmail: string,
) {
  await tx.emailBounceLog.upsert({
    where: { email: recipientEmail },
    update: {
      consecutiveBounces: 0,
      suppressedAt: null,
    },
    create: {
      email: recipientEmail,
      consecutiveBounces: 0,
    },
  });

  const blockedEmail = await tx.blockedEmail.findUnique({
    where: { email: recipientEmail },
  });

  if (
    blockedEmail?.reason &&
    SOFT_BOUNCE_REASONS.has(blockedEmail.reason)
  ) {
    await tx.blockedEmail.delete({
      where: { email: recipientEmail },
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

        const normalizedEmail = recipientEmail.toLowerCase();
        const webhookKey = `${event.data.email_id}:${event.type}`;

        try {
          await prisma.$transaction(async (tx) => {
            await tx.resendLogs.create({
              data: {
                email: normalizedEmail,
                emailId: event.data.email_id,
                subject: event.data.subject,
                status: event.type,
                webhookKey,
              },
            });

            if (
              event.type === 'email.bounced' ||
              event.type === 'email.delivery_delayed'
            ) {
              await handleBounceEvent(tx, event, normalizedEmail);
            } else if (event.type === 'email.delivered') {
              await handleDeliveredEvent(tx, normalizedEmail);
            } else if (event.type === 'email.complained') {
              await deleteEmailSettings(tx, normalizedEmail);
            }
          });
        } catch (error: unknown) {
          if (
            error &&
            typeof error === 'object' &&
            'code' in error &&
            error.code === 'P2002'
          ) {
            logger.info(`Ignoring duplicate webhook ${webhookKey}`);
            return res.status(200).end();
          }

          throw error;
        }

        return res.status(200).end();
      } catch (error) {
        logger.error(error);
        return res.status(400).send(error);
      }
    }
    default:
      res.setHeader('Allow', ['POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
};

export default webhooks;
