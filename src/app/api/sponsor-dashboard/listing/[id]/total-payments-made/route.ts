import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { checkListingSponsorAuth } from '@/features/auth/utils/checkListingSponsorAuth';
import { getSponsorSession } from '@/features/auth/utils/getSponsorSession';

const ParamsSchema = z.object({
  id: z.string().uuid(),
});

export async function GET(
  _: Request,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  logger.debug(`Request params: ${safeStringify(params)}`);
  try {
    const result = ParamsSchema.safeParse(params);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid listing ID' },
        { status: 400 },
      );
    }
    const { id } = result.data;
    const session = await getSponsorSession(await headers());
    if (session.error || !session.data) {
      return NextResponse.json(
        { error: session.error },
        { status: session.status },
      );
    }

    const { error } = await checkListingSponsorAuth(
      session.data.userSponsorId,
      session.data.userHackathonId,
      id,
    );
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    const totalPaymentsMade = await prisma.submission.count({
      where: {
        listingId: id,
        isPaid: true,
      },
    });
    const response = {
      listingId: id,
      totalPaymentsMade,
    };

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch total payments' },
      { status: 500 },
    );
  }
}
