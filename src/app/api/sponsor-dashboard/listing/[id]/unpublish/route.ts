import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

import earncognitoClient from '@/lib/earncognitoClient';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { validateListingSponsorAuth } from '@/features/auth/utils/checkListingSponsorAuth';
import { validateSession } from '@/features/auth/utils/getSponsorSession';
import { refundCredits } from '@/features/credits/utils/allocateCredits';
import { queueEmail } from '@/features/emails/utils/queueEmail';

export async function POST(
  _: Request,
  props: { params: Promise<{ id: string }> },
) {
  const { id } = await props.params;

  logger.debug(`Unpublish request for listing ID: ${id}`);

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

    if (listing.isPublished === false) {
      logger.warn(`Listing ${id} is not published, cannot unpublish`);
      return NextResponse.json(
        { error: 'Listing is not published, cannot unpublish' },
        { status: 400 },
      );
    }

    if (listing.isActive === false) {
      logger.warn(`Listing ${id} is not active, cannot unpublish`);
      return NextResponse.json(
        { error: 'Listing is not active, cannot unpublish' },
        { status: 400 },
      );
    }

    if (listing.isArchived === true) {
      logger.warn(`Listing ${id} is archived, cannot unpublish`);
      return NextResponse.json(
        { error: 'Listing is archived, cannot unpublish' },
        { status: 400 },
      );
    }

    if (listing.status !== 'OPEN') {
      logger.warn(`Listing ${id} is not open, cannot unpublish`);
      return NextResponse.json(
        { error: 'Listing is not open, cannot unpublish' },
        { status: 400 },
      );
    }

    if (listing.isWinnersAnnounced === true) {
      logger.warn(`Listing ${id} has announced winners, cannot unpublish`);
      return NextResponse.json(
        { error: 'Listing has announced winners, cannot unpublish' },
        { status: 400 },
      );
    }

    const result = await prisma.bounties.update({
      where: { id },
      data: { isPublished: false },
    });

    await prisma.submission.updateMany({
      where: {
        listingId: id,
        isWinner: true,
      },
      data: {
        isWinner: false,
        winnerPosition: null,
      },
    });

    if (listing.type === 'project') {
      const submissionsToReject = await prisma.submission.findMany({
        where: {
          listingId: id,
          isWinner: false,
        },
        select: {
          id: true,
          userId: true,
        },
      });

      await prisma.submission.updateMany({
        where: {
          listingId: id,
          isWinner: false,
        },
        data: {
          status: 'Rejected',
        },
      });

      for (const submission of submissionsToReject) {
        try {
          await queueEmail({
            type: 'submissionRejected',
            id: submission.id,
            userId: submission.userId,
            triggeredBy: sessionResult.session.userId,
          });
        } catch (err) {
          logger.warn(
            `Failed to send email notification for submission rejection: ${submission.id}`,
          );
        }
      }
    }

    await refundCredits(id);

    try {
      await earncognitoClient.post(`/discord/listing-update`, {
        listingId: id,
        status: 'Unpublished',
      });
    } catch (err) {
      logger.error('Discord Listing Unpublish Message Error', err);
    }

    try {
      await earncognitoClient.post(`/telegram/unpublish-listing`, {
        listingId: id,
      });
    } catch (err) {
      logger.error('Telegram Listing Unpublish Message Error', err);
    }

    logger.info(`Listing ${id} unpublished successfully`);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    logger.error(`Error unpublishing listing ${id}: ${safeStringify(error)}`);
    return NextResponse.json(
      {
        error: error.message,
        message: 'Error occurred while unpublishing a listing.',
      },
      { status: 400 },
    );
  }
}
