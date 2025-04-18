import { type NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithSponsor } from '@/features/auth/types';
import { checkListingSponsorAuth } from '@/features/auth/utils/checkListingSponsorAuth';
import { withSponsorAuth } from '@/features/auth/utils/withSponsorAuth';
import { type VerifyPaymentsFormData } from '@/features/sponsor-dashboard/types';

export const config = {
  maxDuration: 300,
};

export type ValidatePaymentResult = {
  submissionId: string;
  link?: string;
  status: 'SUCCESS' | 'FAIL' | 'ALREADY_VERIFIED';
  message?: string;
  transactionDate?: Date;
};

async function handler(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  const userSponsorId = req.userSponsorId;

  try {
    logger.debug(`Request body: ${safeStringify(req.body)}`);
    let { paymentLinks } = req.body as VerifyPaymentsFormData;
    const { listingId } = req.body as VerifyPaymentsFormData & {
      listingId: string;
    };

    paymentLinks = paymentLinks.filter((p) => !!p.link);

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

    if (!listing) return res.status(400).json({ error: 'Listing not found' });

    if (!listing.isWinnersAnnounced && listing.type !== 'sponsorship')
      return res.status(400).json({ error: 'Listing not announced' });

    const validationResults: ValidatePaymentResult[] = [];

    for (const paymentLink of paymentLinks) {
      try {
        logger.debug(
          `Force verifying payment for submission ID: ${paymentLink.submissionId}`,
        );

        if (paymentLink.isVerified) {
          validationResults.push({
            submissionId: paymentLink.submissionId,
            link: paymentLink.link,
            status: 'ALREADY_VERIFIED',
            message: 'Already Verified',
          });
          continue;
        }

        validationResults.push({
          submissionId: paymentLink.submissionId,
          link: paymentLink.link,
          status: 'SUCCESS',
        });

        logger.info(
          `Force Payment Verification Successful for Submission ID: ${paymentLink.submissionId}`,
        );
      } catch (error: any) {
        validationResults.push({
          submissionId: paymentLink.submissionId,
          link: paymentLink.link,
          status: 'FAIL',
          message: error.message,
        });
        logger.warn(
          `Force Payment Verification Failed for Submission ID: ${paymentLink.submissionId} with message: ${error.message}`,
        );
      }
    }

    for (const validationResult of validationResults) {
      if (validationResult.status !== 'SUCCESS') continue;

      logger.debug(
        `Updating submission with ID: ${validationResult.submissionId} with new external payment details`,
      );
      await prisma.submission.update({
        where: {
          id: validationResult.submissionId,
        },
        data: {
          isPaid: true,
          paymentDetails: { link: validationResult.link },
          paymentDate: new Date(),
        },
      });
    }

    logger.debug(
      `Updating listing with ID: ${listingId} with new totalPaymentsMade`,
    );
    await prisma.bounties.update({
      where: {
        id: listingId,
      },
      data: {
        totalPaymentsMade: {
          increment: validationResults.filter((r) => r.status === 'SUCCESS')
            .length,
        },
      },
    });

    return res.status(200).json({ validationResults });
  } catch (err: any) {
    logger.error(
      `Error force verifying payments: ${userSponsorId}: ${err.message}`,
    );
    res.status(400).json({
      err: `Error force verifying payments`,
    });
  }
}

export default withSponsorAuth(handler);
