import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { grantId } = req.body;

  if (!grantId) {
    return res.status(400).json({
      message: 'grantId is required in the request body.',
    });
  }

  try {
    const applicationCount = await prisma.grantApplication.count({
      where: {
        grantId,
      },
    });

    res.status(200).json(applicationCount);
  } catch (error: any) {
    res.status(500).json({
      error: error.message,
      message: `Error occurred while fetching grant with id=${grantId}.`,
    });
  }
}
