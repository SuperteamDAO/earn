import { type Prisma } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { prisma } from '@/prisma';

import {
  GrantQueryParamsSchema,
  grantsSelect,
} from '@/features/grants/constants/schema';
import { buildGrantsQuery } from '@/features/grants/utils/query-builder';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const userIdFromCookie: string | null = req.cookies['user-id-hint'] ?? null;

    const validationResult = GrantQueryParamsSchema.safeParse(req.query);
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

    const { where, take } = await buildGrantsQuery(queryData, user);

    const grants = await prisma.grants.findMany({
      where,
      take,
      select: grantsSelect,
    });
    const grantsWithTotalApplications = grants.map((grant) => ({
      ...grant,
      totalApplications:
        grant._count.GrantApplication + grant.historicalApplications,
    }));

    res.status(200).json(grantsWithTotalApplications);
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
