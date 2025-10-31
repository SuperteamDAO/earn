import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/prisma';
import {
  type JsonValue,
  PrismaClientKnownRequestError,
} from '@/prisma/internal/prismaNamespace';

import { getUserSession } from '@/features/auth/utils/getUserSession';
import {
  listingSelect,
  QueryParamsSchema,
} from '@/features/listings/constants/schema';
import { buildListingQuery } from '@/features/listings/utils/query-builder';
import { reorderFeaturedOngoing } from '@/features/listings/utils/reorderFeaturedOngoing';

export async function GET(request: NextRequest) {
  try {
    const session = await getUserSession(await headers());

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
      skills: JsonValue;
    } | null = null;

    const userId = session.data?.userId;

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

    const reorderedListings = reorderFeaturedOngoing(listings);

    return NextResponse.json(reorderedListings, {
      headers: {
        'Cache-Control': 'private, max-age=300, stale-while-revalidate=600',
        Vary: 'Cookie',
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

    if (error instanceof PrismaClientKnownRequestError) {
      console.error('Prisma error:', error.code, error.message);
      return NextResponse.json({ message: 'Database error' }, { status: 500 });
    }

    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
