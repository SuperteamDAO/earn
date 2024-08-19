import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

type DomainCount = {
  domain: string;
  count: number;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        email: true,
      },
    });

    const domainCounts: Record<string, number> = {};

    users.forEach((user) => {
      if (user.email) {
        const domain = user.email.split('@')[1]?.toLowerCase();
        if (domain) {
          domainCounts[domain] = (domainCounts[domain] || 0) + 1;
        }
      }
    });

    const sortedDomains: DomainCount[] = Object.entries(domainCounts)
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count);

    const topDomains = sortedDomains.slice(0, 20); // Get top 10 domains

    return res.status(200).json({
      topDomains: topDomains,
    });
  } catch (error) {
    console.error('Error finding most common email domain:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
