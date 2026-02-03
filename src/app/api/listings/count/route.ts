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
  ListingCategoryOptions,
  QueryParamsSchema,
} from '@/features/listings/constants/schema';
import { buildListingQuery } from '@/features/listings/utils/query-builder';

const CountQueryParamsSchema = QueryParamsSchema.omit({ category: true });

export async function GET(request: NextRequest) {
  const requestHeaders = await headers();

  try {
    const session = await getUserSession(requestHeaders);

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const validationResult = CountQueryParamsSchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json(
        { errors: z.flattenError(validationResult.error) },
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

    const categories = ListingCategoryOptions;

    if (queryData.context === 'bookmarks' && !user?.id) {
      const emptyCategoryCounts: Record<string, number> = {};
      categories.forEach((category) => {
        emptyCategoryCounts[category] = 0;
      });

      return NextResponse.json(emptyCategoryCounts, {
        headers: {
          'Cache-Control': 'private, max-age=300, stale-while-revalidate=600',
          Vary: 'Cookie',
        },
      });
    }

    const counts = await Promise.all(
      categories.map(async (category) => {
        try {
          const { where } = await buildListingQuery(
            { ...queryData, category },
            user,
          );
          const count = await prisma.bounties.count({ where });
          return { category, count };
        } catch (error) {
          console.error(`Error counting category ${category}:`, error);
          return { category, count: 0 };
        }
      }),
    );

    const categoryCounts: Record<string, number> = {};
    counts.forEach(({ category, count }) => {
      categoryCounts[category] = count;
    });

    return NextResponse.json(categoryCounts, {
      headers: {
        'Cache-Control': 'private, max-age=300, stale-while-revalidate=600',
        Vary: 'Cookie',
      },
    });
  } catch (error) {
    console.error('Error in count API handler:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid query parameters', errors: z.flattenError(error) },
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
