import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function submission(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const params = req.query;
  const listingId = params.listingId as string;
  const skip = params.take ? parseInt(params.skip as string, 10) : 0;
  const take = params.take ? parseInt(params.take as string, 10) : 15;
  try {
    const countQuery = {
      where: {
        listingId,
        isActive: true,
        isArchived: false,
      },
    };
    const total = await prisma.submission.count(countQuery);
    const winnersSelected = await prisma.submission.count({
      ...countQuery,
      where: {
        ...countQuery.where,
        isWinner: true,
      },
    });
    const paymentsMade = await prisma.submission.count({
      ...countQuery,
      where: {
        ...countQuery.where,
        isPaid: true,
      },
    });
    const result = await prisma.submission.findMany({
      ...countQuery,
      skip: skip ?? 0,
      take: take ?? 15,
      orderBy: { updatedAt: 'desc' },
      include: {
        user: true,
      },
    });

    res
      .status(200)
      .json({ total, winnersSelected, paymentsMade, data: result });
  } catch (error) {
    res.status(400).json({
      error,
      message: `Error occurred while fetching submission count of listing=${listingId}.`,
    });
  }
}
