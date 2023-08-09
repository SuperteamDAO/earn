import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function submission(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const params = req.query;
  const listingId = params.listingId as string;
  try {
    const result = await prisma.submission.findMany({
      where: {
        listingId,
        isActive: true,
        isArchived: false,
        isWinner: true,
      },
      take: 100,
      orderBy: { updatedAt: 'desc' },
      include: {
        user: true,
      },
    });

    const zapierEndpoint =
      'https://hooks.zapier.com/hooks/catch/11122522/31vi5g7/';
    await axios.post(zapierEndpoint, result);

    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      error,
      message: `Error occurred while fetching submission count of listing=${listingId}.`,
    });
  }
}
