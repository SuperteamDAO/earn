import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

import { prisma } from '@/prisma';

import { getUserSession } from '@/features/auth/utils/getUserSession';
import { buildFeaturedAvailabilityWhere } from '@/features/listing-builder/utils/featured-availability';

export async function POST() {
  const session = await getUserSession(await headers());
  if (session.status !== 200 || !session.data) {
    return NextResponse.json(
      { error: session.error || 'Unauthorized' },
      { status: session.status || 401 },
    );
  }

  try {
    const count = await prisma.bounties.count({
      where: buildFeaturedAvailabilityWhere(),
    });
    return NextResponse.json({ count });
  } catch (error) {
    console.error('featured-posts error', error);
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
  }
}
