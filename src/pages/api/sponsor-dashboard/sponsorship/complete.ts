import dayjs from 'dayjs';
import { type NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithSponsor } from '@/features/auth/types';
import { checkListingSponsorAuth } from '@/features/auth/utils/checkListingSponsorAuth';
import { withSponsorAuth } from '@/features/auth/utils/withSponsorAuth';
import { isDeadlineOver } from '@/features/listings/utils/deadline';

async function handler(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  const { listingId } = req.body;
  const userSponsorId = req.userSponsorId;
  try {
    if (!listingId) {
      return res.status(400).json({ error: 'Listing ID is missing' });
    }

    const { error } = await checkListingSponsorAuth(userSponsorId, listingId);
    if (error) {
      return res.status(error.status).json({ error: error.message });
    }

    const listing = await prisma.bounties.findUnique({
      where: {
        id: listingId,
      },
    });

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (!isDeadlineOver(listing.deadline ?? undefined)) {
      return res
        .status(400)
        .json({ error: 'Listing is not in review or deadline is not over' });
    }

    const deadline = dayjs().isAfter(listing?.deadline)
      ? listing?.deadline
      : dayjs().subtract(2, 'minute').toISOString();

    logger.debug('Updating sponsorship details with winner announcement');
    await prisma.bounties.update({
      where: { id: listingId },
      data: {
        isWinnersAnnounced: true,
        deadline,
        winnersAnnouncedAt: new Date().toISOString(),
      },
      include: {
        sponsor: true,
      },
    });

    return res.status(200).json({ message: 'Listing closed' });
  } catch (error: any) {
    logger.error(
      `Sponsor ${userSponsorId} unable to complete a sponsorship: ${safeStringify(error)}`,
    );
    return res.status(400).json({
      error: error.message,
      message: 'Error occurred while completing a sponsorship.',
    });
  }
}

export default withSponsorAuth(handler);
