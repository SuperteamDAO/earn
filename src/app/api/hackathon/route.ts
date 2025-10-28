import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/prisma';
import { type JsonValue } from '@/prisma/internal/prismaNamespace';

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

    const session = await getUserSession(await headers());

    let user: {
      id: string;
      isTalentFilled: boolean;
      location: string | null;
      skills: JsonValue;
    } | null = null;

    if (session.data?.userId) {
      user = await prisma.user.findUnique({
        where: { id: session.data.userId },
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
