import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function grantApplicationCount(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { slug } = req.query;
  const grantId = slug as string;

  try {
    const result = await prisma.grantApplication.aggregate({
      _count: {
        _all: true,
      },
      _sum: {
        approvedAmount: true,
      },
      _avg: {
        approvedAmount: true,
      },
      where: { grantId, applicationStatus: 'Approved' },
    });

    res.status(200).json({
      count: result._count._all || 0,
      approvedSoFar: result._sum.approvedAmount ?? 0,
      averageApproved: result._avg.approvedAmount ?? 0,
    });
  } catch (error: any) {
    console.error('Error fetching application count:', error);
    res.status(400).json({
      error: error.message,
      message: `Error occurred while fetching application count of grant=${grantId}.`,
    });
  }
}
