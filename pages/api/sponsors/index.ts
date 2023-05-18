import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function user(req: NextApiRequest, res: NextApiResponse) {
  const params = req.query;
  const take = params.take ? parseInt(params.take as string, 10) : 10;
  try {
    const sponsors = await prisma.sponsors.findMany({
      where: {
        isActive: true,
        isArchived: false,
      },
      take,
    });
    res.status(200).json(sponsors);
  } catch (error) {
    console.log(error);

    res.status(400).json({
      error,
      message: 'Error occurred while fetching listings',
    });
  }
}
