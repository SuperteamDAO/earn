import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function user(req: NextApiRequest, res: NextApiResponse) {
  const { slug } = req.body;

  if (!slug) {
    return res.status(400).json({
      message: 'Slug is required in the request body.',
    });
  }

  try {
    const result = await prisma.grants.findFirst({
      where: {
        slug,
      },
      include: { sponsor: true, poc: true },
    });

    if (!result) {
      return res.status(404).json({
        message: `No grant found with slug=${slug}.`,
      });
    }

    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({
      error: error.message,
      message: `Error occurred while fetching grant with slug=${slug}.`,
    });
  }
}
