import logger from '@/lib/logger';
import { prisma } from '@/prisma';

import { addPaymentInfoToAirtable } from './addPaymentInfoToAirtable';

type CreatePaymentProps = {
  submissionId: string;
};

export async function createPayment({ submissionId }: CreatePaymentProps) {
  const submission = await prisma.submission.findUniqueOrThrow({
    where: { id: submissionId },
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

  if (submission.paymentSynced) {
    const errorMessage = `Payment already synced for submission ${submissionId}`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }

  if (submission.user.isKYCVerified !== true) {
    const errorMessage = `User is not verified for submission ${submissionId}`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }

  if (
    !submission.listing.rewards ||
    typeof submission.listing.rewards !== 'object'
  ) {
    const errorMessage = `Invalid rewards structure for submission ${submissionId}`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }

  if (!submission.user.walletAddress) {
    const errorMessage = `Wallet address is required for submission ${submissionId}`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }

  if (!submission.user.username) {
    const errorMessage = `Username is required for submission ${submissionId}`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
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
    throw new Error(errorMessage);
  }

  if (submission.winnerPosition === null) {
    const errorMessage = `Winner position is required for submission ${submissionId}`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }

  if (
    submission.listing.type !== 'bounty' &&
    submission.listing.type !== 'hackathon'
  ) {
    const errorMessage = `Listing type "${submission.listing.type}" is not supported for payment.`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
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
  } catch (airtableError: any) {
    logger.error(
      `Error adding info to Airtable for submission ${submissionId}: ${airtableError.message}`,
      { error: airtableError },
    );
  }

  return submission;
}
