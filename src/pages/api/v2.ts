import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { type PrismaUserWithoutKYC } from '@/interface/user';
import { prisma } from '@/prisma';

import { getPrivyToken } from '@/features/auth/utils/getPrivyToken';
import {
  listingSelect,
  QueryParamsSchema,
} from '@/features/listings/constants/schema';
import { buildListingQuery } from '@/features/listings/query-builder';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const validationResult = QueryParamsSchema.safeParse(req.query);
    if (!validationResult.success) {
      return res.status(400).json({ errors: validationResult.error.flatten() });
    }
    const queryData = validationResult.data;

    const privyDid = await getPrivyToken(req);

    let user: PrismaUserWithoutKYC | null = null;

    if (privyDid) {
      user = await prisma.user.findUnique({
        where: { privyDid },
      });
    }

    const { where, orderBy, take } = await buildListingQuery(queryData, user);

    const listings = await prisma.bounties.findMany({
      where,
      orderBy,
      take,
      select: listingSelect,
    });

    res.status(200).json(listings);
  } catch (error) {
    console.error('Error fetching listings:', error);
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: 'Invalid query parameters', errors: error.flatten() });
    }
    return res
      .status(500)
      .json({ message: 'Internal Server Error: Failed to fetch listings' });
  }
}
