import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function user(req: NextApiRequest, res: NextApiResponse) {
  const params = req.query;
  const slug = params.slug as string;

  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const winnerBannerUrl = req.body.image as string | undefined;
  if (!winnerBannerUrl) {
    return res.status(400).json({ error: 'Winner banner url is required' });
  }

  try {
    const result = await prisma.bounties.findFirst({
      where: {
        slug,
        isActive: true,
      },
    });

    if (!result) {
      return res.status(404).json({
        message: `Bounty with slug=${slug} not found.`,
      });
    }

    await prisma.bounties.update({
      where: {
        id: result.id,
      },
      data: {
        winnerBannerUrl,
      },
    });
    return res.status(200).json({ status: 'success' });
  } catch (error) {
    return res.status(400).json({
      error,
      message: `Error occurred while fetching bounty with slug=${slug}.`,
    });
  }
}
