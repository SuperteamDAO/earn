import type { NextApiRequest, NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const code = (req.query.code || req.body?.code || '')
      .toString()
      .trim()
      .toUpperCase();
    if (!code) {
      return res.status(400).json({ valid: false, reason: 'MISSING_CODE' });
    }

    const inviter = await prisma.user.findUnique({
      where: { referralCode: code },
      select: { id: true, firstName: true, lastName: true, photo: true },
    });
    if (!inviter) {
      return res.status(200).json({ valid: false, reason: 'INVALID' });
    }

    const accepted = await prisma.user.count({
      where: { referredById: inviter.id },
    });
    const remaining = Math.max(0, 10 - accepted);

    return res.status(200).json({
      valid: remaining > 0,
      remaining,
      inviter: {
        id: inviter.id,
        name:
          [inviter.firstName, inviter.lastName].filter(Boolean).join(' ') ||
          'A Superteamer',
        photo: inviter.photo,
      },
    });
  } catch (error: any) {
    logger.error('referral.verify error', error);
    return res.status(500).json({ valid: false, reason: 'ERROR' });
  }
}
