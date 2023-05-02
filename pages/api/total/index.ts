import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function user(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const totals = await prisma.total.findFirst();
    res.status(200).json(totals);
  } catch (error) {
    res.status(400).json({
      error,
      message: 'Error occurred while fetching totals',
    });
  }
}
