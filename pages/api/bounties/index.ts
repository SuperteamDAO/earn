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
  const skip = params.take ? parseInt(params.skip as string, 10) : 0;
  const take = params.take ? parseInt(params.take as string, 10) : 15;
  console.log('file: index.ts:14 ~ skip:', skip, take);
  const whereSearch = searchText
    ? {
        title: {
          contains: searchText,
        },
      }
    : {};
  try {
    const countQuery = {
      where: {
        isActive: true,
        isArchived: false,
        sponsorId,
        ...whereSearch,
      },
    };
    const total = await prisma.bounties.count(countQuery);
    const result = await prisma.bounties.findMany({
      ...countQuery,
      skip: skip ?? 0,
      take: take ?? 15,
      orderBy: [{ deadline: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        title: true,
        slug: true,
        token: true,
        deadline: true,
        isPublished: true,
        rewardAmount: true,
      },
    });
    console.log('file: index.ts:58 ~ result:', result.length);
    res.status(200).json({ total, data: result });
  } catch (err) {
    console.log('file: index.ts:51 ~ err:', err);
    res.status(400).json({ err: 'Error occurred while fetching bounties.' });
  }
}
