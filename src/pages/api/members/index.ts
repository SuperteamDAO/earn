import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function members(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const params = req.query;
  const sponsorId = params.sponsorId as string;
  const skip = params.take ? parseInt(params.skip as string, 10) : 0;
  const take = params.take ? parseInt(params.take as string, 10) : 15;
  const searchText = params.searchText as string;
  const whereSearch = searchText
    ? {
        OR: [
          {
            user: {
              email: {
                contains: searchText,
              },
            },
          },
          {
            user: {
              publicKey: {
                contains: searchText,
              },
            },
          },
          {
            user: {
              username: {
                contains: searchText,
              },
            },
          },
          {
            user: {
              firstName: {
                contains: searchText,
              },
            },
          },
          {
            user: {
              lastName: {
                contains: searchText,
              },
            },
          },
        ],
      }
    : {};
  try {
    const countQuery = {
      where: {
        sponsorId,
        ...whereSearch,
      },
    };
    const total = await prisma.userSponsors.count(countQuery);
    const result = await prisma.userSponsors.findMany({
      ...countQuery,
      skip: skip ?? 0,
      take: take ?? 15,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true,
            publicKey: true,
            photo: true,
          },
        },
      },
    });
    res.status(200).json({ total, data: result });
  } catch (err) {
    console.log('file: index.ts:51 ~ err:', err);
    res.status(400).json({ err: 'Error occurred while fetching members.' });
  }
}
