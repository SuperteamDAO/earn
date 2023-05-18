import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function bounties(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const params = req.query;
  const sponsorId = params.sponsorId as string;
  console.log('file: index.ts:11 ~ sponsorId:', sponsorId);
  const searchText = params.searchText as string;
  const skip = params.take ? parseInt(params.take as string, 10) : 0;
  const take = params.take ? parseInt(params.take as string, 10) : 15;
  const whereSearch = searchText
    ? {
        name: {
          contains: searchText,
        },
      }
    : {};
  try {
    const result = await prisma.bounties.findMany({
      where: {
        isActive: true,
        isArchived: false,
        sponsorId,
        ...whereSearch,
      },
      skip,
      take,
      orderBy: {
        deadline: 'desc',
      },
      select: {
        id: true,
        title: true,
        slug: true,
        token: true,
        deadline: true,
        isPublished: true,
        rewardAmount: true,
        sponsor: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
          },
        },
      },
    });
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ err: 'Error occurred while fetching bounties.' });
  }
}
