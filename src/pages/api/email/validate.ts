import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import logger from '@/lib/logger';
import {
  emailValidateHourlyRateLimiter,
  emailValidateRateLimiter,
} from '@/lib/ratelimit';
import { checkAndApplyRateLimitPages } from '@/lib/rateLimiterService';
import { validateEmailWithZeroBounce } from '@/lib/zerobounce';

const emailValidateSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).email(),
});

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
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const parsed = emailValidateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'A valid email is required' });
  }
  const { email } = parsed.data;

  // adding this to eliminate the need for OSS contributors to set up zerobounce themselves
  const isDev = process.env.VERCEL_ENV !== 'production';
  if (isDev) {
    return res.status(200).json({ isValid: true });
  }

  const ip = getRequestIp(req);

  const withinBurstLimit = await checkAndApplyRateLimitPages({
    limiter: emailValidateRateLimiter,
    identifier: `ip:${ip}`,
    routeName: 'email_validate',
    res,
  });
  if (!withinBurstLimit) return;

  const withinHourlyLimit = await checkAndApplyRateLimitPages({
    limiter: emailValidateHourlyRateLimiter,
    identifier: `ip:${ip}`,
    routeName: 'email_validate_hourly',
    res,
  });
  if (!withinHourlyLimit) return;

  try {
    const isValid = await validateEmailWithZeroBounce(email);
    return res.status(200).json({ isValid });
  } catch (error) {
    const status = axios.isAxiosError(error) ? error.response?.status : null;
    logger.error(
      `Error validating email with ZeroBounce (status: ${status ?? 'unknown'})`,
    );
    // fail open so a provider outage doesn't block legitimate sign-ins
    return res.status(200).json({ isValid: true });
  }
}
