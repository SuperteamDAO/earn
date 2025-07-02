import { type Prisma } from '@prisma/client';
import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/prisma';

import { getUserSession } from '@/features/auth/utils/getUserSession';
import { HackathonQueryParamsSchema } from '@/features/hackathon/constants/schema';
import { buildHackathonQuery } from '@/features/hackathon/utils/query-builder';
import { listingSelect } from '@/features/listings/constants/schema';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const validationResult = HackathonQueryParamsSchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json(
        { errors: validationResult.error.flatten() },
        { status: 400 },
      );
    }
    const queryData = validationResult.data;

    let user: {
      id: string;
      isTalentFilled: boolean;
      location: string | null;
      skills: Prisma.JsonValue;
    } | null = null;

    const session = await getUserSession(await headers());

    const { userId } = session.data ?? {};

    if (userId) {
      user = await prisma.user.findUnique({
        where: { id: userId },
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

    return NextResponse.json(listings);
  } catch (error) {
    console.error('Error in API handler:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid query parameters', errors: error.flatten() },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
