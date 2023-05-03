import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function comment(
  _req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const result = await prisma.total.create({
      data: {
        total: 623215,
        totalInUSD: 623215,
        count: 139,
      },
    });
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      error,
      message: 'Error occurred while adding a new comment.',
    });
  }
}
