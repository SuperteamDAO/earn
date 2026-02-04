import { createHash } from 'crypto';
import { type IncomingMessage } from 'http';
import { type NextApiRequest } from 'next';
import { type NextApiRequestCookies } from 'next/dist/server/api-utils';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

type AgentSession = {
  agentId: string;
  userId: string;
};

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function getAgentSession(
  req:
    | NextApiRequest
    | (IncomingMessage & {
        cookies: NextApiRequestCookies;
      }),
): Promise<AgentSession | null> {
  try {
    const authHeader = req.headers?.authorization || '';
    const token = authHeader.replace('Bearer ', '').trim();

    if (!token) {
      logger.warn(
        'Unauthorized, Agent API key not found in authorization header',
      );
      return null;
    }

    const apiKeyHash = hashToken(token);

    const agent = await prisma.agent.findUnique({
      where: { apiKeyHash },
      select: { id: true, userId: true, status: true },
    });

    if (!agent || agent.status !== 'ACTIVE') {
      logger.warn('Unauthorized, invalid or inactive agent API key', {
        apiKeyHash,
      });
      return null;
    }

    return { agentId: agent.id, userId: agent.userId };
  } catch (error) {
    logger.error(
      'Unauthorized, Error verifying agent API key',
      safeStringify(error),
    );
    return null;
  }
}
