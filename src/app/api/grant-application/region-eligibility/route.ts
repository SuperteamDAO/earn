import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { getChapterRegions } from '@/utils/chapterRegion';
import { safeStringify } from '@/utils/safeStringify';

import { getUserSession } from '@/features/auth/utils/getUserSession';
import { verifiedUserRegionEligibility } from '@/features/listings/utils/region';

export async function GET(request: NextRequest) {
  const session = await getUserSession(await headers());

  if (session.error || !session.data) {
    return NextResponse.json(
      { error: session.error },
      { status: session.status },
    );
  }

  const userId = session.data.userId as string;
  const grantId = request.nextUrl.searchParams.get('grantId');

  if (!grantId) {
    return NextResponse.json(
      { error: 'Grant ID is required' },
      { status: 400 },
    );
  }

  try {
    const [grant, user] = await Promise.all([
      prisma.grants.findUnique({
        where: { id: grantId },
        select: { region: true },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { location: true, isKYCVerified: true, kycCountry: true },
      }),
    ]);

    if (!grant || !user) {
      return NextResponse.json(
        { error: 'Grant or user not found' },
        { status: 404 },
      );
    }

    const isEligible = verifiedUserRegionEligibility({
      region: grant.region,
      location: user.location,
      isKYCVerified: user.isKYCVerified,
      kycCountry: user.kycCountry,
      chapters: await getChapterRegions(),
    });

    return NextResponse.json({ isEligible });
  } catch (error) {
    logger.error(
      `Unable to check region eligibility for user ${userId} and grant ${grantId}: ${safeStringify(error)}`,
    );
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
