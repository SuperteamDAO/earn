import type { NextApiRequest, NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const listingsToBackfill = await prisma.bounties.findMany({
      where: {
        tokenUsdAtPublish: null,
        usdValue: { gt: 0 },
        rewardAmount: { gt: 0 },
        isPublished: true,
      },
      select: {
        id: true,
        usdValue: true,
        rewardAmount: true,
        updatedAt: true,
        token: true,
        title: true,
      },
    });

    logger.info(
      `Found ${listingsToBackfill.length} listings to backfill tokenUsdAtPublish`,
    );

    if (listingsToBackfill.length === 0) {
      return res.status(200).json({
        message: 'No listings found that need backfilling',
        updated: 0,
      });
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: Array<{ id: string; error: string }> = [];

    // Process each listing
    for (const listing of listingsToBackfill) {
      try {
        const tokenUsdAtPublish = listing.usdValue! / listing.rewardAmount!;

        // Update the listing with calculated tokenUsdAtPublish
        // Preserve the original updatedAt timestamp
        await prisma.bounties.update({
          where: { id: listing.id },
          data: {
            tokenUsdAtPublish,
            updatedAt: listing.updatedAt, // Preserve original timestamp
          },
        });

        logger.info(
          `Backfilled listing ${listing.id} (${listing.title}): tokenUsdAtPublish = ${tokenUsdAtPublish}`,
        );
        successCount++;
      } catch (error) {
        logger.error(
          `Failed to backfill listing ${listing.id}: ${error}`,
          error,
        );
        errors.push({
          id: listing.id,
          error: error instanceof Error ? error.message : String(error),
        });
        errorCount++;
      }
    }

    const summary = {
      message: 'Backfill completed',
      total: listingsToBackfill.length,
      successful: successCount,
      failed: errorCount,
      ...(errors.length > 0 && { errors }),
    };

    logger.info('Backfill summary:', summary);

    return res.status(200).json(summary);
  } catch (error) {
    logger.error('Error during backfill operation:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
