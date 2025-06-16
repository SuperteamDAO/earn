import type { NextApiResponse } from 'next';

import { tokenList } from '@/constants/tokenList';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { fetchTokenUSDValue } from '@/utils/fetchTokenUSDValue';
import { createSputnikProposal, isNearnIoRequestor } from '@/utils/near';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithSponsor } from '@/features/auth/types';
import { checkListingSponsorAuth } from '@/features/auth/utils/checkListingSponsorAuth';
import { withSponsorAuth } from '@/features/auth/utils/withSponsorAuth';
import { type Rewards } from '@/features/listings/types';

function generateProposalDescription(
  listingName: string,
  userName: string,
  submissionLink: string,
  listingSequentialId: number,
  type: 'bounty' | 'project' | 'sponsorship' | 'hackathon',
) {
  return `* Title: NEARN payment to ${userName} for the listing "${listingName}"<br>* Summary: This payment is for the successful completion of the ${type} "${listingName}" on NEARN. The submission has been reviewed and approved by the sponsor. <br>* Notes:${submissionLink}<br>* Proposal Id: ${listingSequentialId}<br>* Url: ${submissionLink}.`;
}

async function handler(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  logger.debug(`Request body: ${safeStringify(req.body)}`);
  const { id } = req.body;

  try {
    const currentSubmission = await prisma.submission.findUnique({
      where: { id },
      include: {
        user: true,
        listing: {
          include: {
            sponsor: true,
          },
        },
      },
    });

    if (!currentSubmission) {
      logger.warn(`Submission with ID ${id} not found`);
      return res.status(404).json({
        message: `Submission with ID ${id} not found.`,
      });
    }

    const userSponsorId = req.userSponsorId;

    const { error } = await checkListingSponsorAuth(
      userSponsorId,
      currentSubmission.listingId,
    );
    if (error) {
      return res.status(error.status).json({ error: error.message });
    }

    const { listing, user } = currentSubmission;

    const nearTreasury = listing.sponsor.nearTreasury as {
      dao: string;
      frontend: string;
    } | null;

    if (!nearTreasury?.dao) {
      logger.warn('Sponsor has not configured NEAR Treasury');
      return res.status(400).json({
        error: 'Sponsor has not configured NEAR Treasury',
        message: 'Sponsor has not configured NEAR Treasury',
      });
    }

    const isRequestor = await isNearnIoRequestor(nearTreasury.dao);

    if (!isRequestor) {
      logger.warn('NEARN does not have permission to create proposals');
      return res.status(403).json({
        error: 'NEARN does not have permission to create proposals',
        message: 'NEARN does not have permission to create proposals',
      });
    }

    if (!listing.rewards || currentSubmission.winnerPosition === null) {
      logger.warn(
        'Listing has no rewards or submission has no winner position',
      );
      return res.status(400).json({
        error: 'Listing has no rewards or submission has no winner position',
        message: 'Listing has no rewards or submission has no winner position',
      });
    }

    const inUsd = listing.token === 'Any';
    const tokenSymbol = inUsd ? currentSubmission.token : listing.token;
    const token = tokenList.find((t) => t.tokenSymbol === tokenSymbol);
    let amount =
      (listing.rewards as Rewards)[
        Number(currentSubmission.winnerPosition) as keyof Rewards
      ] ?? 0;

    if (amount === undefined) {
      logger.warn('Submission has no winner position');
      return res.status(400).json({
        error: 'Submission has no winner position',
        message: 'Submission has no winner position',
      });
    }

    if (!token) {
      logger.warn(`Token ${tokenSymbol} not found in token list`);
      return res.status(400).json({
        error: 'Invalid token',
        message: 'Invalid token',
      });
    }

    if (!currentSubmission.user.publicKey) {
      logger.warn('User does not have a public key');
      return res.status(400).json({
        error: 'User does not have a public key',
        message: 'User does not have a public key',
      });
    }

    const userName = user.private ? user.username : user.name;
    const listingName = listing.title || 'Untitled Bounty';
    const listingLink = `${process.env.NEXT_PUBLIC_SITE_URL}/${listing.sponsor.slug}/${listing.sequentialId}/`;
    const link =
      listing.type === 'project'
        ? listingLink
        : `${listingLink}${currentSubmission.sequentialId}`;
    const description = generateProposalDescription(
      listingName,
      userName || 'user',
      link,
      listing.sequentialId ?? 0,
      listing.type,
    );

    if (inUsd) {
      const usdAmount = await fetchTokenUSDValue(token.tokenSymbol);
      amount = amount / usdAmount;
    }

    logger.debug(`Creating proposal for submission ID: ${id}`);
    const proposalId = await createSputnikProposal(
      nearTreasury.dao,
      description,
      token,
      currentSubmission.user.publicKey!,
      amount,
    );

    const treasuryLink = `${nearTreasury.frontend}/?page=payments&id=${proposalId}`;
    logger.debug(`Updating submission with ID: ${id}`);
    await prisma.submission.update({
      where: { id },
      data: {
        paymentDate: new Date(),
        paymentDetails: {
          treasury: {
            link: treasuryLink,
            proposalId,
            dao: nearTreasury.dao,
          },
        },
      },
    });

    logger.info(
      `Successfully created treasury proposal for submission ID: ${id}`,
    );
    return res.status(200).json({
      message: 'Proposal created successfully',
      proposalId,
      url: treasuryLink,
    });
  } catch (error: any) {
    logger.error(
      `Error creating treasury proposal for submission ${id}: ${safeStringify(
        error,
      )}`,
    );
    return res.status(400).json({
      error: error.message,
      message: `Error occurred while creating treasury proposal for submission ${id}.`,
    });
  }
}

export default withSponsorAuth(handler);
