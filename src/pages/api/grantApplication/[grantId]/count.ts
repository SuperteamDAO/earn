import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function grantApplicationCount(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const params = req.query;
  const grantId = params.grantId as string;
  try {
    const result = await prisma.grantApplication.aggregate({
      _count: true,
      where: { grantId },
    });
    res.status(200).json(result?._count || 0);
  } catch (error) {
    res.status(400).json({
      error,
      message: `Error occurred while fetching application count of grant=${grantId}.`,
    });
  }
}
