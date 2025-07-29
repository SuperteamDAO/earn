// used for api route, dont add use client here.
import { type Bounties } from '@prisma/client';

import earncognitoClient from '@/lib/earncognitoClient';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { dayjs } from '@/utils/dayjs';

import { queueAgent } from '@/features/agents/utils/queueAgent';
import { type ListingWithSponsor } from '@/features/auth/utils/checkListingSponsorAuth';
import { queueEmail } from '@/features/emails/utils/queueEmail';

interface PostSaveParams {
  result: Bounties;
  originalListing?: ListingWithSponsor;
  userId: string;
  isEditing: boolean;
  isVerifying: boolean;
  reason?: string;
}

export async function handlePostSaveOperations(context: PostSaveParams) {
  const { result, originalListing, userId, isEditing, isVerifying, reason } =
    context;
  const listingId = result.id;

  try {
    await handleDiscordNotifications({
      result,
      originalListing,
      listingId,
      isEditing,
      isVerifying,
      reason,
    });

    if (isEditing && originalListing) {
      await handleDeadlineChanges({
        originalListing,
        result,
        userId,
        listingId,
      });
    }

    await handleAgentJobQueuing(result);

    logger.info(
      `Listing ${isEditing ? 'Update' : 'Publish'} API Fully Successful with ID: ${listingId}`,
    );
  } catch (error) {
    logger.error(
      `Error in post-save operations for listing ${listingId}:`,
      error,
    );
  }
}

async function handleDiscordNotifications({
  result,
  originalListing,
  listingId,
  isEditing,
  isVerifying,
  reason,
}: {
  result: Bounties;
  originalListing?: ListingWithSponsor;
  listingId: string;
  isEditing: boolean;
  isVerifying: boolean;
  reason?: string;
}) {
  try {
    if (!isEditing) {
      if (isVerifying && originalListing?.status !== 'VERIFYING') {
        logger.info('Sending Discord Verification message', { id: listingId });

        if (!process.env.EARNCOGNITO_URL) {
          throw new Error('ENV EARNCOGNITO_URL not provided');
        }

        await earncognitoClient.post(`/discord/verify-listing/initiate`, {
          listingId: result.id,
          reason,
        });

        logger.info('Sent Discord Verification message', { id: listingId });
      } else {
        const discordStatus = result.isPublished
          ? 'Published'
          : isVerifying
            ? 'To be Verified'
            : 'Draft Added';

        await sendDiscordListingUpdate(listingId, discordStatus);
      }
    } else {
      await sendDiscordListingUpdate(listingId, 'Updated');
    }
  } catch (err) {
    const operation =
      !isEditing && isVerifying ? 'Verification' : 'Listing Update';
    logger.error(`Discord ${operation} Message Error`, {
      id: listingId,
      error: err,
    });
  }
}

async function sendDiscordListingUpdate(listingId: string, status: string) {
  logger.info('Sending Discord Listing Update message', {
    id: listingId,
    discordStatus: status,
  });

  await earncognitoClient.post(`/discord/listing-update`, {
    listingId,
    status,
  });

  logger.info('Sent Discord Listing Update message', {
    id: listingId,
  });
}

async function handleDeadlineChanges({
  originalListing,
  result,
  userId,
  listingId,
}: {
  originalListing: ListingWithSponsor;
  result: Bounties;
  userId: string;
  listingId: string;
}) {
  const deadlineChanged =
    originalListing.deadline?.toString() !== result.deadline?.toString();

  if (!deadlineChanged) return;

  logger.info('Deadline has been changed', {
    id: listingId,
    previousDeadline: originalListing.deadline,
    newDeadline: result.deadline,
  });

  if (!result.isPublished) return;

  try {
    const dayjsDeadline = dayjs(result.deadline);

    logger.debug(
      `Creating comment for deadline extension for listing ID: ${result.id}`,
      {
        id: listingId,
        deadlineChanged,
        isPublished: result.isPublished,
      },
    );

    await prisma.comment.create({
      data: {
        message: `The deadline for this listing has been updated to ${dayjsDeadline.format('h:mm A, MMMM D, YYYY (UTC)')}`,
        refId: result.id,
        refType: 'BOUNTY',
        authorId: userId,
        type: 'DEADLINE_EXTENSION',
      },
    });

    logger.debug(
      `Comment Created for deadline extension for listing ID: ${result.id}`,
      { id: result.id },
    );

    logger.debug(`Sending email notification for deadline extension`, {
      id: listingId,
    });

    await queueEmail({
      type: 'deadlineExtended',
      id: listingId,
      triggeredBy: userId,
    });

    logger.debug(`Sent email notification for deadline extension`, {
      id: listingId,
    });
  } catch (err) {
    logger.error('Error handling deadline change:', {
      id: listingId,
      error: err,
    });
  }
}

async function handleAgentJobQueuing(result: Bounties) {
  if (result.type !== 'project') return;

  try {
    await queueAgent({
      type: 'generateContextProject',
      id: result.id,
    });

    logger.info(
      `Successfully queued agent job for generateContextProject with id ${result.id}`,
    );
    console.log(
      `Successfully queued agent job for generateContextProject with id ${result.id}`,
    );
  } catch (err) {
    logger.error(
      `Failed to queue agent job for generateContextProject with id ${result.id}`,
      err,
    );
    console.log(
      `Failed to queue agent job for generateContextProject with id ${result.id}`,
    );
  }
}
