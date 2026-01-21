import { NextResponse } from 'next/server';

import { prisma } from '@/prisma';

import { buildFeaturedAvailabilityWhere } from '@/features/listing-builder/utils/featured-availability';

export async function POST() {
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
