import { createHash } from 'crypto';
import type { NextApiResponse } from 'next';
import { z } from 'zod';

import logger from '@/lib/logger';
import { agentClaimRateLimiter } from '@/lib/ratelimit';
import { checkAndApplyRateLimitPages } from '@/lib/rateLimiterService';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithUser } from '@/features/auth/types';
import { withAuth } from '@/features/auth/utils/withAuth';

const schema = z.object({
  claimCode: z.string().min(4).max(64),
});

function hashClaimCode(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

function getRequestIp(req: NextApiRequestWithUser): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    const [first] = forwarded.split(',');
    return (first ?? forwarded).trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const ip = getRequestIp(req);
  const rateLimitAllowed = await checkAndApplyRateLimitPages({
    limiter: agentClaimRateLimiter,
    identifier: `${userId}:${ip}`,
    routeName: 'agent_claim',
    res,
  });
  if (!rateLimitAllowed) return;

  try {
    const { claimCode } = schema.parse(req.body);
    const normalized = claimCode.trim().toUpperCase();
    const claimCodeHash = hashClaimCode(normalized);

    const claimant = await prisma.user.findUnique({
      where: { id: userId },
      select: { isTalentFilled: true },
    });

    if (!claimant) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!claimant.isTalentFilled) {
      return res.status(403).json({
        error: 'Complete your talent profile before claiming an agent',
      });
    }

    const agent = await prisma.agent.findUnique({
      where: { claimCodeHash },
      select: {
        id: true,
        userId: true,
        claimedByUserId: true,
        status: true,
        user: { select: { username: true } },
      },
    });

    if (!agent || agent.status !== 'ACTIVE') {
      return res.status(404).json({ error: 'Invalid claim code' });
    }

    if (agent.claimedByUserId && agent.claimedByUserId !== userId) {
      return res.status(409).json({ error: 'Agent already claimed' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedAgent = await tx.agent.update({
        where: { id: agent.id },
        data: {
          claimedByUserId: userId,
          claimedAt: new Date(),
        },
      });

      const updatedSubmissions = await tx.submission.updateMany({
        where: {
          agentId: agent.id,
          userId: agent.userId,
        },
        data: {
          userId,
        },
      });

      return { updatedAgent, updatedSubmissions };
    });

    return res.status(200).json({
      agentId: result.updatedAgent.id,
      claimedByUserId: result.updatedAgent.claimedByUserId,
      linkedSubmissions: result.updatedSubmissions.count,
      agentUsername: agent.user.username,
    });
  } catch (error: any) {
    logger.error('[AgentClaim] Failed to claim agent', safeStringify(error));

    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.flatten() });
    }

    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

export default withAuth(handler);
