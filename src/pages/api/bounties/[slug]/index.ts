import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const params = req.query;
  const slug = params.slug as string;
  const type = params.type as 'bounty' | 'project' | 'hackathon';
  try {
    const result = await prisma.bounties.findFirst({
      where: {
        slug,
        type,
        isActive: true,
      },
      include: {
        sponsor: { select: { name: true, logo: true, entityName: true } },
        poc: true,
        Hackathon: {
          select: {
            altLogo: true,
            startDate: true,
            name: true,
            description: true,
            slug: true,
            announceDate: true,
          },
        },
      },
    });

    if (!result) {
      return res.status(404).json({
        message: `Bounty with slug=${slug} not found.`,
      });
    }

    return res.status(200).json(result);
  } catch (error: any) {
    console.error(`unable to view listing`, error.message);
    return res.status(400).json({
      error,
      message: `Error occurred while fetching bounty with slug=${slug}.`,
    });
  }
}
