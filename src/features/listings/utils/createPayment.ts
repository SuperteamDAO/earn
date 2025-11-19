import logger from '@/lib/logger';
import { prisma } from '@/prisma';

import { addPaymentInfoToAirtable } from './addPaymentInfoToAirtable';
import { checkKycCountryMatchesRegion } from './region';

type CreatePaymentProps = {
  userId: string;
};

export async function createPayment({ userId }: CreatePaymentProps) {
  const ANNOUNCEMENT_CUTOFF_DATE = new Date('2025-08-06');

  const submissions = await prisma.submission.findMany({
    where: {
      userId,
      paymentSynced: false,
      winnerPosition: { not: null },
      listing: {
        type: { in: ['bounty', 'hackathon'] },
        isWinnersAnnounced: true,
        isFndnPaying: true,
        winnersAnnouncedAt: { gte: ANNOUNCEMENT_CUTOFF_DATE },
      },
    },
    select: {
      id: true,
      winnerPosition: true,
      paymentSynced: true,
      listing: {
        select: {
          id: true,
          title: true,
          rewards: true,
          type: true,
          slug: true,
          region: true,
        },
      },
      user: {
        select: {
          id: true,
          walletAddress: true,
          email: true,
          username: true,
          location: true,
          kycName: true,
          kycAddress: true,
          kycDOB: true,
          kycIDNumber: true,
          kycIDType: true,
          kycCountry: true,
          isKYCVerified: true,
        },
      },
    },
  });

  if (submissions.length === 0) {
    const errorMessage = `No eligible submissions found for user ${userId}`;
    logger.info(errorMessage);
    return { processed: 0, submissions: [] };
  }

  logger.info(
    `Found ${submissions.length} eligible submissions for user ${userId}`,
  );

  const processedSubmissions = [];
  const errors = [];

  for (const submission of submissions) {
    const submissionId = submission.id;

    try {
      if (submission.paymentSynced) {
        const errorMessage = `Payment already synced for submission ${submissionId}`;
        logger.error(errorMessage);
        errors.push({ submissionId, error: errorMessage });
        continue;
      }

      if (submission.user.isKYCVerified !== true) {
        const errorMessage = `User is not verified for submission ${submissionId}`;
        logger.error(errorMessage);
        errors.push({ submissionId, error: errorMessage });
        continue;
      }

      if (
        !submission.listing.rewards ||
        typeof submission.listing.rewards !== 'object'
      ) {
        const errorMessage = `Invalid rewards structure for submission ${submissionId}`;
        logger.error(errorMessage);
        errors.push({ submissionId, error: errorMessage });
        continue;
      }

      if (!submission.user.walletAddress) {
        const errorMessage = `Wallet address is required for submission ${submissionId}`;
        logger.error(errorMessage);
        errors.push({ submissionId, error: errorMessage });
        continue;
      }

      if (!submission.user.username) {
        const errorMessage = `Username is required for submission ${submissionId}`;
        logger.error(errorMessage);
        errors.push({ submissionId, error: errorMessage });
        continue;
      }

      if (
        !submission.user.kycName ||
        !submission.user.kycCountry ||
        !submission.user.kycDOB ||
        !submission.user.kycIDNumber ||
        !submission.user.kycIDType
      ) {
        const errorMessage = `Complete KYC information is required for submission ${submissionId}`;
        logger.error(errorMessage);
        errors.push({ submissionId, error: errorMessage });
        continue;
      }

      if (submission.winnerPosition === null) {
        const errorMessage = `Winner position is required for submission ${submissionId}`;
        logger.error(errorMessage);
        errors.push({ submissionId, error: errorMessage });
        continue;
      }

      if (
        submission.listing.type !== 'bounty' &&
        submission.listing.type !== 'hackathon'
      ) {
        const errorMessage = `Listing type "${submission.listing.type}" is not supported for payment.`;
        logger.error(errorMessage);
        errors.push({ submissionId, error: errorMessage });
        continue;
      }

      const kycCountryCheck = checkKycCountryMatchesRegion(
        submission.user.kycCountry,
        submission.listing.region,
      );

      if (!kycCountryCheck.isValid) {
        const errorMessage = `KYC country ${submission.user.kycCountry} does not match listing region ${submission.listing.region} for submission ${submissionId}`;
        logger.warn(errorMessage);
        errors.push({ submissionId, error: errorMessage });
        continue;
      }

      logger.info(`Creating payment for submission ${submissionId}`);

      const typedSubmission = {
        id: submission.id,
        winnerPosition: submission.winnerPosition as number,
        listing: {
          id: submission.listing.id,
          title: submission.listing.title,
          rewards: submission.listing.rewards as Record<string, number>,
          type: submission.listing.type,
          slug: submission.listing.slug,
        },
        user: {
          walletAddress: submission.user.walletAddress,
          email: submission.user.email,
          username: submission.user.username,
          location: submission.user.location,
          kycName: submission.user.kycName,
          kycCountry: submission.user.kycCountry,
          kycAddress: submission.user.kycAddress,
          kycDOB: submission.user.kycDOB,
          kycIDNumber: submission.user.kycIDNumber,
          kycIDType: submission.user.kycIDType,
        },
      };

      logger.info(`Prepared payment data for submission ${submissionId}`);

      try {
        logger.info(
          `Adding payment info to Airtable for submission ${submissionId}`,
        );
        await addPaymentInfoToAirtable(typedSubmission);
        await prisma.submission.update({
          where: { id: submissionId },
          data: { paymentSynced: true },
        });
        processedSubmissions.push(submission);
        logger.info(
          `Successfully processed payment for submission ${submissionId}`,
        );
      } catch (airtableError: any) {
        logger.error(
          `Error adding info to Airtable for submission ${submissionId}: ${airtableError.message}`,
          { error: airtableError },
        );
        errors.push({ submissionId, error: airtableError.message });
      }
    } catch (validationError: any) {
      logger.error(
        `Validation error for submission ${submissionId}: ${validationError.message}`,
        { error: validationError },
      );
      errors.push({ submissionId, error: validationError.message });
    }
  }

  logger.info(
    `Payment processing completed for user ${userId}: ${processedSubmissions.length} successful, ${errors.length} failed`,
  );

  return {
    processed: processedSubmissions.length,
    submissions: processedSubmissions,
    errors,
  };
}
