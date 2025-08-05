import { type NextRequest, NextResponse } from 'next/server';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    logger.info(`Request body: ${safeStringify(body)}`);

    const { username } = body;

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        twitter: true,
        linkedin: true,
        github: true,
        website: true,
        username: true,
        workPrefernce: true,
        firstName: true,
        lastName: true,
        skills: true,
        photo: true,
        currentEmployer: true,
        location: true,
      },
    });

    if (!user) {
      logger.warn(
        `User not found for the provided criteria: ${safeStringify(body)}`,
      );
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = user.id;
    logger.info(`User found: ${userId}`);
    return NextResponse.json({ ...user });
  } catch (error: any) {
    logger.error(`Error fetching user details: ${safeStringify(error)}`);
    return NextResponse.json(
      { error: `Unable to fetch user details: ${error.message}` },
      { status: 500 },
    );
  }
}
