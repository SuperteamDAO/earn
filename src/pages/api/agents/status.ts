import type { NextApiResponse } from 'next';

import { prisma } from '@/prisma';

import { type NextApiRequestWithAgent } from '@/features/auth/types';
import { withAgentAuth } from '@/features/auth/utils/withAgentAuth';

async function handler(req: NextApiRequestWithAgent, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const agentId = req.agentId;
  if (!agentId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    select: {
      id: true,
      name: true,
      status: true,
      userId: true,
      claimedByUserId: true,
      claimedAt: true,
      createdAt: true,
      lastUsedAt: true,
    },
  });

  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }

  return res.status(200).json(agent);
}

export default withAgentAuth(handler);
