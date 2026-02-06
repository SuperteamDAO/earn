import crypto from 'crypto';
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import logger from '@/lib/logger';
import { agentRegisterRateLimiter } from '@/lib/ratelimit';
import { checkAndApplyRateLimitPages } from '@/lib/rateLimiterService';
import { prisma } from '@/prisma';
import { PrismaClientKnownRequestError } from '@/prisma/internal/prismaNamespace';
import { safeStringify } from '@/utils/safeStringify';

import {
  generateApiKey,
  generateClaimCode,
} from '@/features/agents/utils/agentTokens';
import { generateUniqueRandomUsername } from '@/features/talent/utils/generateUniqueRandomUsername';

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
      submit: 'POST /api/agents/submissions/create',
      editSubmission: 'POST /api/agents/submissions/update',
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
    const firstNameSeed = name.trim().split(/\s+/)[0];

    const { apiKey, apiKeyHash, apiKeyPrefix } = generateApiKey();
    const { claimCode, claimCodeHash, claimCodePrefix } = generateClaimCode();

    let username: string | null = null;
    let agent: { id: string; name: string; userId: string } | null = null;

    for (let attempt = 0; attempt < 3; attempt++) {
      username = await generateUniqueRandomUsername(firstNameSeed);
      if (!username) break;

      try {
        agent = await prisma.$transaction(async (tx) => {
          await tx.user.create({
            data: {
              id: userId,
              email,
              privyDid,
              username,
              firstName: name,
              lastName: 'agent',
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

        break;
      } catch (error: any) {
        const duplicateField = error.meta?.target;
        const isUsernameCollision =
          error instanceof PrismaClientKnownRequestError &&
          error.code === 'P2002' &&
          ((Array.isArray(duplicateField) &&
            duplicateField.includes('username')) ||
            (typeof duplicateField === 'string' &&
              duplicateField.includes('username')));

        if (isUsernameCollision) {
          continue;
        }

        throw error;
      }
    }

    if (!agent || !username) {
      throw new Error('Could not generate a unique username for this agent');
    }

    return res.status(201).json({
      agentId: agent.id,
      userId: agent.userId,
      name: agent.name,
      username,
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
