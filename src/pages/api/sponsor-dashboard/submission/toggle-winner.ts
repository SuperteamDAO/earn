import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';

import { type NextApiRequestWithSponsor } from '@/features/auth/types';
import { checkListingSponsorAuth } from '@/features/auth/utils/checkListingSponsorAuth';
import { withSponsorAuth } from '@/features/auth/utils/withSponsorAuth';
import { BONUS_REWARD_POSITION } from '@/features/listing-builder/constants';

interface SubmissionUpdate {
  id: string;
  isWinner?: boolean;
  winnerPosition?: number;
}

const MAX_SUBMISSIONS_UPDATE_LIMIT = 50;

async function handler(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  const userId = req.userId;
  const userSponsorId = req.userSponsorId;

  logger.debug(`Request body: ${JSON.stringify(req.body)}`);
  const { submissions: requestSubmissions } = req.body as {
    submissions: SubmissionUpdate[];
  };

  if (!Array.isArray(requestSubmissions)) {
    logger.warn(
      `User ${userId} sent invalid request body: submissions is not an array.`,
    );
    return res
      .status(400)
      .json({ error: 'Request body must contain an array of submissions.' });
  }

  if (requestSubmissions.length === 0) {
    logger.warn(`User ${userId} sent empty submissions array.`);
    return res
      .status(400)
      .json({ error: 'Submissions array cannot be empty.' });
  }

  if (requestSubmissions.length > MAX_SUBMISSIONS_UPDATE_LIMIT) {
    logger.warn(
      `User ${userId} exceeded submission update limit. Count: ${requestSubmissions.length}, Limit: ${MAX_SUBMISSIONS_UPDATE_LIMIT}`,
    );
    return res.status(400).json({
      error: `Cannot update more than ${MAX_SUBMISSIONS_UPDATE_LIMIT} submissions at once.`,
    });
  }

  const submissionIdSet = new Set<string>();
  for (const submissionUpdate of requestSubmissions) {
    const { id, isWinner, winnerPosition } = submissionUpdate;
    if (!id) {
      logger.warn(
        `User ${userId} sent submission update without an ID.`,
        submissionUpdate,
      );
      return res
        .status(400)
        .json({ error: 'Each submission update must include an id.' });
    }
    if (submissionIdSet.has(id)) {
      logger.warn(
        `User ${userId} sent duplicate submission ID: ${id}.`,
        requestSubmissions,
      );
      return res
        .status(400)
        .json({ error: `Duplicate submission ID found: ${id}` });
    }
    submissionIdSet.add(id);

    if (
      (isWinner !== undefined && winnerPosition === undefined) ||
      (isWinner === undefined && winnerPosition !== undefined)
    ) {
      logger.warn(
        `User ${userId} sent inconsistent isWinner/winnerPosition for submission ${id}.`,
        submissionUpdate,
      );
      return res.status(400).json({
        error: `For submission ${id}, isWinner and winnerPosition must be provided together if either is present`,
      });
    }
    if (isWinner === false && winnerPosition !== undefined) {
      logger.warn(
        `Submission ${id} has winnerPosition but isWinner is false. Position will be ignored/nulled.`,
      );
    }
  }

  const submissionIds = Array.from(submissionIdSet);

  try {
    const currentSubmissions = await prisma.submission.findMany({
      where: {
        id: {
          in: submissionIds,
        },
      },
      include: {
        listing: true,
      },
    });

    if (currentSubmissions.length !== requestSubmissions.length) {
      const foundIds = currentSubmissions.map((c) => c.id);
      const missingIds = submissionIds.filter((id) => !foundIds.includes(id));
      logger.warn(
        `User ${userId} requested update for non-existent submissions. Provided: ${submissionIds.length}, Found: ${foundIds.length}. Missing IDs: ${missingIds.join(', ')}`,
      );
      return res.status(404).json({
        error: `Some submission records were not found. Missing IDs: ${missingIds.join(', ')}`,
      });
    }

    const firstListing = currentSubmissions[0]?.listing;
    if (!firstListing) {
      logger.error(
        `Could not determine listing from fetched submissions for user ${userId}. Submission IDs: ${submissionIds.join(', ')}`,
      );
      return res
        .status(500)
        .json({ error: 'Internal server error: Could not verify listing.' });
    }
    const listingId = firstListing.id;

    if (
      !currentSubmissions.every(
        (submission) => submission.listingId === listingId,
      )
    ) {
      logger.warn(
        `User ${userId} attempted to update submissions from multiple listings in one request. Listing ID determined: ${listingId}.`,
        submissionIds,
      );
      return res
        .status(400)
        .json({ error: 'All submissions must belong to the same listing.' });
    }

    const { error: authError } = await checkListingSponsorAuth(
      userSponsorId,
      listingId,
    );
    if (authError) {
      logger.warn(
        `User ${userId} failed authorization check for listing ${listingId}. Status: ${authError.status}, Message: ${authError.message}`,
      );
      return res.status(authError.status).json({ error: authError.message });
    }

    if (firstListing.isWinnersAnnounced) {
      logger.warn(
        `User ${userId} attempted to toggle winners for listing ${listingId} after winners were announced.`,
      );
      return res.status(400).json({
        error: 'Submissions cannot be toggled post winner announcement.',
      });
    }

    if (firstListing.type === 'project') {
      const projectWinnersInRequest = requestSubmissions.filter(
        (s) => s.isWinner === true,
      );
      if (projectWinnersInRequest.length > 1) {
        logger.warn(
          `User ${userId} attempted to set multiple winners for project listing ${listingId}. Count: ${projectWinnersInRequest.length}`,
        );
        return res.status(400).json({
          error: 'For project listings, only one submission can be the winner.',
        });
      }
      if (
        projectWinnersInRequest.length === 1 &&
        projectWinnersInRequest[0]?.winnerPosition !== 1
      ) {
        logger.warn(
          `User ${userId} attempted to set winner position other than 1 for project listing ${listingId}. Position: ${projectWinnersInRequest[0]?.winnerPosition}`,
        );
        return res.status(400).json({
          error: 'For project listings, the winner position must be 1.',
        });
      }
    }

    const otherExistingWinners = await prisma.submission.findMany({
      where: {
        listingId: listingId,
        isWinner: true,
        winnerPosition: { not: null },
        id: { notIn: submissionIds },
      },
      select: { id: true, winnerPosition: true },
    });
    const otherExistingWinnerPositions = new Set(
      otherExistingWinners
        .map((w) => w.winnerPosition)
        .filter((p): p is number => p !== null),
    );
    const otherExistingBonusWinnerCount = otherExistingWinners.filter(
      (w) => w.winnerPosition === BONUS_REWARD_POSITION,
    ).length;

    const incomingWinnerPositions = new Map<number, number>();
    let incomingBonusWinnerCount = 0;

    for (const subUpdate of requestSubmissions) {
      if (subUpdate.isWinner && subUpdate.winnerPosition !== undefined) {
        const pos = subUpdate.winnerPosition;

        if (pos !== BONUS_REWARD_POSITION) {
          if (otherExistingWinnerPositions.has(pos)) {
            logger.warn(
              `User ${userId} attempted to assign duplicate winner position ${pos} for listing ${listingId}. Position already held by submission outside this batch.`,
            );
            return res.status(400).json({
              error: `Winner position ${pos} is already assigned to another submission not in this update batch.`,
            });
          }
          const currentCount = incomingWinnerPositions.get(pos) || 0;
          if (currentCount > 0) {
            logger.warn(
              `User ${userId} attempted to assign duplicate winner position ${pos} within the same request for listing ${listingId}.`,
            );
            return res.status(400).json({
              error: `Winner position ${pos} is assigned multiple times within this request.`,
            });
          }
          incomingWinnerPositions.set(pos, currentCount + 1);
        } else {
          incomingBonusWinnerCount++;
        }
      }
    }

    const totalBonusWinners =
      otherExistingBonusWinnerCount + incomingBonusWinnerCount;
    if (
      firstListing.maxBonusSpots !== null &&
      totalBonusWinners > firstListing.maxBonusSpots
    ) {
      logger.warn(
        `User ${userId} attempted to exceed max bonus spots (${firstListing.maxBonusSpots}) for listing ${listingId}. Proposed total: ${totalBonusWinners}`,
      );
      return res.status(400).json({
        error: `Assigning these winners would exceed the maximum allowed bonus spots (${firstListing.maxBonusSpots}). Current count (including this batch): ${totalBonusWinners}`,
      });
    }

    const currentSubmissionMap = new Map(
      currentSubmissions.map((sub) => [sub.id, sub]),
    );

    const autoFixedSubmissions: string[] = [];

    const updatePromises = requestSubmissions.map(async (submissionUpdate) => {
      const { id, isWinner, winnerPosition } = submissionUpdate;
      const currentSubmission = currentSubmissionMap.get(id)!;

      const finalWinnerPosition = isWinner ? winnerPosition : null;

      const updateData: any = {
        isWinner,
        winnerPosition: finalWinnerPosition,
      };

      // if marked as winner and currently has 'Spam' label, change label to 'Unreviewed'
      if (isWinner && currentSubmission.label === 'Spam') {
        updateData.label = 'Unreviewed';
        autoFixedSubmissions.push(id);
        logger.info(
          `Automatically removing Spam label from submission ${id} as it's being marked as a winner`,
        );
      }

      logger.debug(`Updating submission with ID: ${id}`);
      const result = await prisma.submission.update({
        where: { id },
        data: updateData,
        include: {
          listing: true,
        },
      });

      const ask =
        result.ask ||
        (result.listing.type === 'project' &&
        result.listing.compensationType === 'range'
          ? ((result.listing.minRewardAsk || 0) +
              (result.listing.maxRewardAsk || 0)) /
            2
          : 1);

      if (currentSubmission.isWinner !== isWinner) {
        logger.debug(
          `Winner status changed for submission ${id}. Updating bounty details for listing ID: ${listingId}`,
        );

        if (firstListing.compensationType !== 'fixed') {
          logger.debug(
            `Fetching token USD value for variable or range compensation for submission ${id}`,
          );
          const tokenUSDValue: number | undefined = (firstListing as any)
            .tokenUsdAtPublish as number | undefined;
          const usdValue = (tokenUSDValue ?? 0) * ask;

          await prisma.bounties.update({
            where: { id: listingId },
            data: {
              rewards: { 1: ask },
              rewardAmount: ask,
              usdValue,
            },
          });
        }
      }
      return result;
    });

    await Promise.all(updatePromises);

    logger.info(
      `Successfully updated ${requestSubmissions.length} submissions for listing ${listingId} by user ${userId}`,
    );
    return res.status(200).json({
      message: 'Success',
      autoFixed: autoFixedSubmissions.length > 0,
      autoFixedSubmissions,
    });
  } catch (error: any) {
    logger.error(
      `User ${userId} unable to toggle winners for batch: ${error.message}`,
      { error, submissionIds },
    );
    return res.status(400).json({
      error: error.message,
      message: `Error occurred while updating submissions.`,
    });
  }
}

export default withSponsorAuth(handler);
