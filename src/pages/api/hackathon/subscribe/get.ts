import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    console.log('slug - ', req.body.slug);
    const hackathon = await prisma.hackathon.findUnique({
      where: {
        slug: req.body.slug,
      },
    });
    console.log('hackathon - ', hackathon);
    if (!hackathon)
      return res.status(400).json({
        message: 'Hackathon not found',
      });
    const result = await prisma.subscribeHackathon.findMany({
      where: {
        hackathonId: hackathon.id,
        isArchived: false,
      },
      include: {
        User: true,
      },
    });
    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res.status(400).json({
      error,
      message: 'Error occurred while adding a new bounty.',
    });
  }
}
