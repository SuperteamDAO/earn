import { type Prisma, Prisma as PrismaNamespace } from '@prisma/client';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/prisma';

import {
  GrantQueryParamsSchema,
  grantsSelect,
} from '@/features/grants/constants/schema';
import { buildGrantsQuery } from '@/features/grants/utils/query-builder';

export async function GET(request: NextRequest) {
  try {
    const userIdFromCookie = request.cookies.get('user-id-hint')?.value;

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const validationResult = GrantQueryParamsSchema.safeParse(queryParams);
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

    return NextResponse.json(grantsWithTotalApplications, {
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
