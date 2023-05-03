import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function grants(
  _req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const result = await prisma.grants.findMany({
      where: {
        isActive: true,
        isPublished: true,
        isArchived: false,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      select: {
        id: true,
        title: true,
        slug: true,
        shortDescription: true,
        token: true,
        rewardAmount: true,
        link: true,
        sponsor: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
          },
        },
      },
    });
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ err: 'Error occurred while fetching grants.' });
  }
}
