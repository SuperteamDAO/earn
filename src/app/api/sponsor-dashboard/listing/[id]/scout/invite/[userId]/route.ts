import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { validateListingSponsorAuth } from '@/features/auth/utils/checkListingSponsorAuth';
import { validateSession } from '@/features/auth/utils/getSponsorSession';
import { queueEmail } from '@/features/emails/utils/queueEmail';

export async function POST(
  _: Request,
  props: { params: Promise<{ id: string; userId: string }> },
) {
  const { id, userId } = await props.params;

  logger.debug(
    `Scout invite request for listing ID: ${id} and user ID: ${userId}`,
  );

  try {
    const sessionResult = await validateSession(await headers());
    if ('error' in sessionResult) {
      return sessionResult.error;
    }
    const { userId: sponsorUserId, userSponsorId } = sessionResult.session;

    const listingAuthResult = await validateListingSponsorAuth(
      userSponsorId,
      id,
    );
    if ('error' in listingAuthResult) {
      return listingAuthResult.error;
    }

    const invitedCount = await prisma.scouts.count({
      where: {
        listingId: id,
        invited: true,
      },
    });

    if (invitedCount >= 10) {
      logger.warn(
        `Maximum number of invited scouts reached for listing ID: ${id}`,
      );
      return NextResponse.json(
        { error: 'Maximum number of invited scouts reached' },
        { status: 400 },
      );
    }

    logger.debug(`Fetching scout for listing ID: ${id} and user ID: ${userId}`);
    const scout = await prisma.scouts.findFirst({
      where: {
        listingId: id,
        userId: userId,
      },
    });

    if (!scout) {
      logger.warn(
        `Scout not found for listing ID: ${id} and user ID: ${userId}`,
      );
      return NextResponse.json({ error: 'Scout Not Found' }, { status: 404 });
    }

    logger.debug(
      `Sending scout invite email for listing ID: ${id} and user ID: ${userId}`,
    );
    await queueEmail({
      type: 'scoutInvite',
      id: id,
      userId,
      triggeredBy: sponsorUserId,
    });

    logger.debug(`Updating scout invitation status for scout ID: ${scout.id}`);
    await prisma.scouts.update({
      where: {
        id: scout.id,
      },
      data: {
        invited: true,
      },
    });

    logger.info(
      `Scout invitation sent successfully for listing ID: ${id} and user ID: ${userId}`,
    );
    return NextResponse.json({ message: 'Success' }, { status: 200 });
  } catch (error: any) {
    logger.error(
      `Error occurred while inviting scout user=${userId} for bounty with id=${id}: ${safeStringify(error)}`,
    );
    return NextResponse.json(
      {
        error: error.message,
        message: `Error occurred while inviting scout user=${userId} for bounty with id=${id}.`,
      },
      { status: 400 },
    );
  }
}
