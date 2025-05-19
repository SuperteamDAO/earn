import { type Prisma } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { prisma } from '@/prisma';
import { USER_ID_COOKIE_NAME } from '@/store/user';

import { HackathonQueryParamsSchema } from '@/features/hackathon/constants/schema';
import { buildHackathonQuery } from '@/features/hackathon/utils/query-builder';
import { listingSelect } from '@/features/listings/constants/schema';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const userIdFromCookie: string | null =
      req.cookies[USER_ID_COOKIE_NAME] ?? null;

    const validationResult = HackathonQueryParamsSchema.safeParse(req.query);
    if (!validationResult.success) {
      return res.status(400).json({ errors: validationResult.error.flatten() });
    }
    const queryData = validationResult.data;

    let user: {
      id: string;
      isTalentFilled: boolean;
      location: string | null;
      skills: Prisma.JsonValue;
    } | null = null;

    if (userIdFromCookie) {
      user = await prisma.user.findUnique({
        where: { id: userIdFromCookie },
        select: {
          id: true,
          isTalentFilled: true,
          location: true,
          skills: true,
        },
      });
    }

    const { where, orderBy, take } = await buildHackathonQuery(queryData, user);

    const listings = await prisma.bounties.findMany({
      where,
      orderBy,
      take,
      select: listingSelect,
    });

    res.status(200).json(listings);
  } catch (error) {
    console.error('Error in API handler:', error);
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: 'Invalid query parameters', errors: error.flatten() });
    }
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
