import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { validateListingSponsorAuth } from '@/features/auth/utils/checkListingSponsorAuth';
import { validateSession } from '@/features/auth/utils/getSponsorSession';

export async function DELETE(
  _: Request,
  props: { params: Promise<{ id: string }> },
) {
  const { id } = await props.params;

  logger.debug(`Delete request for bounty ID: ${id}`);

  try {
    const sessionResult = await validateSession(await headers());
    if ('error' in sessionResult) {
      return sessionResult.error;
    }

    const listingAuthResult = await validateListingSponsorAuth(
      sessionResult.session.userSponsorId,
      id,
    );
    if ('error' in listingAuthResult) {
      return listingAuthResult.error;
    }

    const { listing } = listingAuthResult;

    if (listing.status !== 'OPEN' || listing.isPublished) {
      logger.warn(`Bounty ${id} is not in a deletable state`);
      return NextResponse.json(
        { message: 'Only draft bounties can be deleted' },
        { status: 400 },
      );
    }

    await prisma.bounties.update({
      where: { id },
      data: { isActive: false },
    });

    logger.info(`Draft bounty ${id} deleted successfully`);
    return NextResponse.json(
      { message: `Draft Bounty with id=${id} deleted successfully.` },
      { status: 200 },
    );
  } catch (error: any) {
    logger.error(`Error deleting bounty ${id}: ${safeStringify(error)}`);
    return NextResponse.json(
      {
        error: error.message,
        message: `Error occurred while deleting bounty with id=${id}.`,
      },
      { status: 400 },
    );
  }
}
