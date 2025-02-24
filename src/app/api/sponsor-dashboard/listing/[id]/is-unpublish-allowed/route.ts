import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';

import { checkListingSponsorAuth } from '@/features/auth/utils/checkListingSponsorAuth';
import { getSponsorSession } from '@/features/auth/utils/getSponsorSession';

const ParamsSchema = z.object({
  id: z.string().uuid(),
});

export async function GET(
  _request: Request,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const result = ParamsSchema.safeParse(await props.params);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid listing ID' },
        { status: 400 },
      );
    }

    const { id } = result.data;
    logger.debug('Checking pending submissions for listing:', { id });

    const session = await getSponsorSession(await headers());
    if (!session.data) {
      return NextResponse.json(
        { error: session.error || 'Unauthorized' },
        { status: session.status },
      );
    }

    const { error, listing } = await checkListingSponsorAuth(
      session.data.userSponsorId,
      id,
    );
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    if (listing.type !== 'project') {
      return NextResponse.json({ data: { allowed: true } }, { status: 200 });
    }

    const pendingCount = await prisma.submission.count({
      where: {
        listingId: id,
        status: 'Pending',
      },
    });

    return NextResponse.json(
      {
        data: { allowed: pendingCount === 0 },
      },
      { status: 200 },
    );
  } catch (error) {
    logger.error('Error checking pending submissions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
