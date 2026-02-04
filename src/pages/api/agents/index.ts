import crypto from 'crypto';
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import logger from '@/lib/logger';
import { agentRegisterRateLimiter } from '@/lib/ratelimit';
import { checkAndApplyRateLimitPages } from '@/lib/rateLimiterService';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import {
  generateApiKey,
  generateClaimCode,
} from '@/features/agents/utils/agentTokens';

const schema = z.object({
  name: z.string().min(2).max(80),
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
  if (req.method === 'GET') {
    return res.status(200).json({
      message: 'Superteam Earn Agent API',
      docs: '/skill.md',
      heartbeat: '/heartbeat.md',
      register: 'POST /api/agents',
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const ip = getRequestIp(req);
  const rateLimitAllowed = await checkAndApplyRateLimitPages({
    limiter: agentRegisterRateLimiter,
    identifier: ip,
    routeName: 'agent_register',
    res,
  });
  if (!rateLimitAllowed) return;

  try {
    const { name } = schema.parse(req.body);

    const userId = crypto.randomUUID();
    const email = `agent+${userId}@agents.superteam.fun`;
    const privyDid = `agent:${userId}`;

    const { apiKey, apiKeyHash, apiKeyPrefix } = generateApiKey();
    const { claimCode, claimCodeHash, claimCodePrefix } = generateClaimCode();

    const agent = await prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          id: userId,
          email,
          privyDid,
          firstName: name,
          isAgent: true,
          isTalentFilled: true,
        },
      });

      return tx.agent.create({
        data: {
          name,
          userId,
          apiKeyHash,
          apiKeyPrefix,
          claimCodeHash,
          claimCodePrefix,
          status: 'ACTIVE',
        },
        select: { id: true, name: true, userId: true },
      });
    });

    return res.status(201).json({
      agentId: agent.id,
      userId: agent.userId,
      name: agent.name,
      apiKey,
      claimCode,
    });
  } catch (error: any) {
    logger.error(
      '[AgentRegister] Failed to create agent',
      safeStringify(error),
    );

    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.flatten() });
    }

    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
