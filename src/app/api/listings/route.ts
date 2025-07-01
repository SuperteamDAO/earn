import { type Prisma, Prisma as PrismaNamespace } from '@prisma/client';
import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/prisma';
import { USER_ID_COOKIE_NAME } from '@/store/user';

import {
  listingSelect,
  QueryParamsSchema,
} from '@/features/listings/constants/schema';
import { buildListingQuery } from '@/features/listings/utils/query-builder';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userIdFromCookie: string | null =
      cookieStore.get(USER_ID_COOKIE_NAME)?.value ?? null;

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const validationResult = QueryParamsSchema.safeParse(queryParams);
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

    // build optimized query
    const { where, orderBy, take } = await buildListingQuery(queryData, user);

    const listings = await prisma.bounties.findMany({
      where,
      orderBy,
      take,
      select: {
        ...listingSelect,
        ...(queryData.category === 'For You' && user?.id
          ? {
              SubscribeBounty: {
                where: { userId: user.id },
                select: { userId: true },
              },
            }
          : {}),
      },
    });

    return NextResponse.json(listings, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Error in API handler:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid query parameters', errors: error.flatten() },
        { status: 400 },
      );
    }

    if (error instanceof PrismaNamespace.PrismaClientKnownRequestError) {
      console.error('Prisma error:', error.code, error.message);
      return NextResponse.json({ message: 'Database error' }, { status: 500 });
    }

    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
