import type { NextApiRequest, NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { generateUniqueReferralCode } from '@/utils/referralCodeGenerator';
import { safeStringify } from '@/utils/safeStringify';

interface BackfillResponse {
  message: string;
  processed: number;
  updated: number;
  skipped: number;
  errors: number;
}

export default async function backfillReferralCodes(
  _req: NextApiRequest,
  res: NextApiResponse<BackfillResponse | { error: string }>,
) {
  try {
    // Get all users without referral codes
    const usersWithoutCodes = await prisma.user.findMany({
      where: {
        OR: [{ referralCode: null }, { referralCode: '' }],
      },
      select: { id: true, email: true },
      orderBy: { createdAt: 'asc' },
    });

    logger.info(
      `Found ${usersWithoutCodes.length} users without referral codes`,
    );

    let updated = 0;
    let errors = 0;
    const batchSize = 50; // Process in batches to avoid overwhelming the database

    // Process users in batches
    for (let i = 0; i < usersWithoutCodes.length; i += batchSize) {
      const batch = usersWithoutCodes.slice(i, i + batchSize);

      logger.info(
        `Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(usersWithoutCodes.length / batchSize)}`,
      );

      // Process each user in the current batch
      const batchPromises = batch.map(async (user) => {
        try {
          const referralCode = await generateUniqueReferralCode();

          await prisma.user.update({
            where: { id: user.id },
            data: { referralCode },
          });

          logger.debug(
            `Generated referral code ${referralCode} for user ${user.id}`,
          );
          return { success: true, userId: user.id };
        } catch (error) {
          logger.error(
            `Failed to generate referral code for user ${user.id}: ${safeStringify(error)}`,
          );
          return { success: false, userId: user.id, error };
        }
      });

      // Wait for current batch to complete
      const batchResults = await Promise.allSettled(batchPromises);

      // Count results
      for (const result of batchResults) {
        if (result.status === 'fulfilled' && result.value.success) {
          updated++;
        } else {
          errors++;
        }
      }

      // Small delay between batches to be gentle on the database
      if (i + batchSize < usersWithoutCodes.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    const response: BackfillResponse = {
      message: 'Referral code backfill completed',
      processed: usersWithoutCodes.length,
      updated,
      skipped: 0, // We don't skip any users in this implementation
      errors,
    };

    logger.info(`Backfill completed: ${safeStringify(response)}`);
    return res.status(200).json(response);
  } catch (error: any) {
    logger.error(
      `Error during referral code backfill: ${safeStringify(error)}`,
    );
    return res.status(500).json({
      error: 'Error occurred during referral code backfill',
    });
  }
}
