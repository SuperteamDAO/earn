import { type NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { getErrorMessage } from '@/utils/getErrorMessage';

import { type NextApiRequestWithSponsor } from '@/features/auth/types';
import { withSponsorAuth } from '@/features/auth/utils/withSponsorAuth';

async function handler(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  const userSponsorId = req.userSponsorId;
  try {
    const listingsCount = await prisma.bounties.count({
      where: {
        sponsorId: userSponsorId,
        isPublished: true,
        isActive: true,
        deadline: {
          lte: new Date(),
        },
        isWinnersAnnounced: false,
      },
    });
    if (listingsCount >= 5) {
      logger.info('Not Allowed To Create More Listings');
      return res.status(200).json({ allowed: false });
    }
    logger.info('Allowed To Create More Listings');
    return res.status(200).json({ allowed: true });
  } catch (err) {
    logger.error(
      `Error checking if sponsor is allowed to create more listings: ${userSponsorId}: ${getErrorMessage(err)}`,
    );
    res.status(400).json({
      err: 'Error checking if sponsor is allowed to create more listings:',
    });
  }
}

export default withSponsorAuth(handler);
