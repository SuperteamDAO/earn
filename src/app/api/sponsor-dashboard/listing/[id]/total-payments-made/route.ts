import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { validateListingSponsorAuth } from '@/features/auth/utils/checkListingSponsorAuth';
import { validateSession } from '@/features/auth/utils/getSponsorSession';

const ParamsSchema = z.object({
  id: z.uuid(),
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
    const sessionResult = await validateSession(await headers());
    if ('error' in sessionResult) {
      return sessionResult.error;
    }

    const { userSponsorId } = sessionResult.session;
    const listingAuthResult = await validateListingSponsorAuth(
      userSponsorId,
      id,
    );
    if ('error' in listingAuthResult) {
      return listingAuthResult.error;
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
