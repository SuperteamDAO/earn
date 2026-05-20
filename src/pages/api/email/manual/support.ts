import type { NextApiRequest, NextApiResponse } from 'next';
import { Resend } from 'resend';
import { z } from 'zod';

import logger from '@/lib/logger';
import { supportEmailRateLimiter } from '@/lib/ratelimit';
import { checkAndApplyRateLimitPages } from '@/lib/rateLimiterService';
import { safeStringify } from '@/utils/safeStringify';

import { supportEmailTemplate } from '@/features/emails/components/supportEmailTemplate';

const resend = new Resend(process.env.RESEND_API_KEY);

const supportEmailSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  subject: z.string().trim().min(1),
  description: z.string().trim().min(10),
});

type SuccessResponse = {
  success: boolean;
  messageId?: string;
};

type ErrorResponse = {
  error: string | z.ZodIssue[];
  message?: string;
  retryAfter?: number;
};

function getRequestIp(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    const [first] = forwarded.split(',');
    return (first ?? forwarded).trim();
  }

  return req.socket.remoteAddress || 'unknown';
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const body = req.body;
    logger.debug(`Request body: ${safeStringify(req.body)}`);

    const { email, subject, description } = supportEmailSchema.parse(body);
    const ip = getRequestIp(req);

    const ipRateLimitAllowed = await checkAndApplyRateLimitPages({
      limiter: supportEmailRateLimiter,
      identifier: `ip:${ip}`,
      routeName: 'support_email_ip',
      res,
    });
    if (!ipRateLimitAllowed) return;

    const emailRateLimitAllowed = await checkAndApplyRateLimitPages({
      limiter: supportEmailRateLimiter,
      identifier: `email:${email}`,
      routeName: 'support_email_email',
      res,
    });
    if (!emailRateLimitAllowed) return;

    logger.info('Sending Support Request Email');
    const { data, error } = await resend.emails.send({
      from: `Earn Support Form <support-form@superteamearn.com>`,
      to: ['support@superteam.fun'],
      replyTo: email,
      subject: `Support Request: ${subject}`,
      react: supportEmailTemplate({ from: email, subject, description }),
    });

    if (error) {
      logger.error('Error sending email:', error);
      return res.status(500).json({ error: 'Failed to send email' });
    }

    return res.status(200).json({ success: true, messageId: data?.id });
  } catch (error) {
    logger.error('Error in support email API:', safeStringify(error));

    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
}
