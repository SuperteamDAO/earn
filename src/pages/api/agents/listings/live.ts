
import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const now = new Date();

    const listings = await prisma.bounties.findMany({
      where: {
        isPublished: true,
        isActive: true,
        isArchived: false,
        status: 'OPEN',
        isAgentAllowed: true,
        deadline: {
          gte: now,
        },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        type: true,
        deadline: true,
        rewardAmount: true,
        usdValue: true,
        token: true,
        description: true,
        requirements: true,
        skills: true,
        isAgentAllowed: true,
        status: true,
        sponsor: {
          select: {
            id: true,
            name: true,
            logo: true,
            url: true,
          },
        },
      },
      orderBy: {
        deadline: 'asc',
      },
    });

    return res.status(200).json({
      listings,
      count: listings.length,
    });
  } catch (error) {
    console.error('Error fetching live agent listings:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
