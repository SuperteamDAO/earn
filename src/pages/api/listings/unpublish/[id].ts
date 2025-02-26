import { type NextApiResponse } from 'next';

import earncognitoClient from '@/lib/earncognitoClient';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithSponsor } from '@/features/auth/types';
import { checkListingSponsorAuth } from '@/features/auth/utils/checkListingSponsorAuth';
import { withSponsorAuth } from '@/features/auth/utils/withSponsorAuth';

async function handler(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  const id = req.query.id as string;
  const userId = req.userId;
  const userSponsorId = req.userSponsorId;

  if (!userId) {
    logger.warn('Invalid token: User Id is missing');
    return res.status(400).json({ error: 'Invalid token' });
  }

  if (!userSponsorId) {
    logger.warn('Invalid token: User Sponsor Id is missing');
    return res.status(400).json({ error: 'Invalid token' });
  }

  logger.debug(`Request body: ${safeStringify(req.body)}`);

  try {
    const { error, listing } = await checkListingSponsorAuth(
      userSponsorId,
      id as string,
    );
    if (error) {
      return res.status(error.status).json({ error: error.message });
    }
    if (listing.isPublished === false) {
      logger.warn(`Listing with id=${id} is not published, cannot unpublish`);
      return res
        .status(400)
        .json({ error: 'Listing is not published, cannot unpublish' });
    }
    if (listing.isActive === false) {
      logger.warn(`Listing with id=${id} is not active, cannot unpublish`);
      return res
        .status(400)
        .json({ error: 'Listing is not active, cannot unpublish' });
    }
    if (listing.isArchived === true) {
      logger.warn(`Listing with id=${id} is archived, cannot unpublish`);
      return res
        .status(400)
        .json({ error: 'Listing is archived, cannot unpublish' });
    }
    if (listing.status !== 'OPEN') {
      logger.warn(`Listing with id=${id} is not open, cannot unpublish`);
      return res
        .status(400)
        .json({ error: 'Listing is not open, cannot unpublish' });
    }
    if (listing.isWinnersAnnounced === true) {
      logger.warn(
        `Listing with id=${id} has announced winners, cannot unpublish`,
      );
      return res
        .status(400)
        .json({ error: 'Listing has announced winners, cannot unpublish' });
    }
    const result = await prisma.bounties.update({
      where: { id },
      data: {
        isPublished: false,
      },
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
    try {
      await earncognitoClient.post(`/discord/listing-update`, {
        listingId: id,
        status: 'Unpublished',
      });
    } catch (err) {
      logger.error('Discord Listing Unpublish Message Error', err);
    }
    logger.info(`Listing with id=${id} unpublished successfully`);
    res.status(200).send(result);
  } catch (error: any) {
    logger.error(
      `User ${userId} unable to unpublish a listing: ${safeStringify(error)}`,
    );
    return res.status(400).json({
      error: error.message,
      message: 'Error occurred while unpublishing a listing.',
    });
  }
}

export default withSponsorAuth(handler);
