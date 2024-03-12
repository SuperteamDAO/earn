import { type NextApiRequest, type NextApiResponse } from 'next';

import { prisma } from '@/prisma';
import { dayjs } from '@/utils/dayjs';

export default async function user(req: NextApiRequest, res: NextApiResponse) {
  const take = req.query.take ? parseInt(req.query.take as string, 10) : 10;

  const result: any = {
    bounties: [],
    grants: [],
  };

  try {
    const bounties = await prisma.bounties.findMany({
      where: {
        isPublished: true,
        isActive: true,
        isArchived: false,
        isPrivate: true,
        status: 'OPEN',
        sponsor: {
          name: 'Solana Gaming',
        },
      },
      include: {
        sponsor: {
          select: {
            name: true,
            slug: true,
            logo: true,
          },
        },
      },
      take,
    });

    const sortedData = bounties
      .sort((a, b) => dayjs(b.deadline).diff(dayjs(a.deadline)))
      .slice(0, take);
    result.bounties = sortedData;

    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res.status(400).json({
      error,
      message: 'Error occurred while fetching listings',
    });
  }
}
