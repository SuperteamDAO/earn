import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithSponsor } from '@/features/auth/types';
import { checkListingSponsorAuth } from '@/features/auth/utils/checkListingSponsorAuth';
import { withSponsorAuth } from '@/features/auth/utils/withSponsorAuth';
import { addSpamPenaltyCredit } from '@/features/credits/utils/allocateCredits';
import { queueEmail } from '@/features/emails/utils/queueEmail';

async function handler(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  const userId = req.userId;

  if (!userId) {
    logger.warn('Invalid token: User ID not found');
    return res.status(400).json({ error: 'Invalid token' });
  }

  logger.debug(`Request body: ${safeStringify(req.body)}`);
  const { id, ids, label } = req.body;

  const submissionIds = ids ? ids : id ? [id] : [];

  if (!submissionIds.length || !label) {
    logger.warn('Missing parameters: id/ids and label are required');
    return res.status(400).json({ error: 'id/ids and label are required' });
  }

  if (submissionIds.length > 1 && !['Spam', 'Shortlisted'].includes(label)) {
    logger.warn(`Multiple submissions not allowed for label: ${label}`);
    return res.status(400).json({
      error:
        'Multiple submissions only allowed for Spam and Shortlisted labels',
    });
  }

  try {
    const currentSubmissions = await prisma.submission.findMany({
      where: { id: { in: submissionIds } },
    });

    if (currentSubmissions.length !== submissionIds.length) {
      const foundIds = currentSubmissions.map((s) => s.id);
      const missingIds = submissionIds.filter(
        (id: string) => !foundIds.includes(id),
      );
      logger.warn(`Submissions not found: ${missingIds.join(', ')}`);
      return res.status(404).json({
        message: `Submissions not found: ${missingIds.join(', ')}`,
      });
    }

    if (currentSubmissions.length === 0) {
      logger.warn('No submissions found');
      return res.status(404).json({
        message: 'No submissions found',
      });
    }

    const userSponsorId = req.userSponsorId;
    const firstSubmission = currentSubmissions[0]!;

    const { error, listing } = await checkListingSponsorAuth(
      userSponsorId,
      firstSubmission.listingId,
    );
    if (error) {
      return res.status(error.status).json({ error: error.message });
    }

    const differentListings = currentSubmissions.filter(
      (s) => s.listingId !== firstSubmission.listingId,
    );
    if (differentListings.length > 0) {
      logger.warn('Submissions belong to different listings');
      return res.status(400).json({
        error: 'All submissions must belong to the same listing',
      });
    }

    if (listing?.isWinnersAnnounced) {
      const winnerSubmissions = currentSubmissions.filter((s) => s.isWinner);
      if (winnerSubmissions.length > 0) {
        return res.status(400).json({
          error: 'Cannot change label of announced winners',
        });
      }
    }

    const results = [];
    let autoFixedCount = 0;

    for (const submission of currentSubmissions) {
      let autoFixed = false;
      const updateData: any = { label };

      if (label === 'Spam' && submission.isWinner) {
        updateData.isWinner = false;
        updateData.winnerPosition = null;
        autoFixed = true;
        autoFixedCount++;
        logger.info(
          `Automatically removing winner status from submission ${submission.id} as it's being marked as Spam`,
        );
      }

      logger.debug(
        `Updating submission with ID: ${submission.id} and label: ${label}`,
      );

      const result = await prisma.submission.update({
        where: { id: submission.id },
        data: updateData,
      });

      if (label === 'Spam') {
        await addSpamPenaltyCredit(submission.id);
        try {
          await queueEmail({
            type: 'spamCredit',
            id: submission.id,
            userId: submission.userId,
            triggeredBy: userId,
          });
          logger.info(
            `Spam credit email queued for submission ${submission.id}`,
          );
        } catch (err) {
          logger.warn(
            `Failed to queue spam credit email for submission ${submission.id}:`,
            err,
          );
        }
      }

      results.push({ ...result, autoFixed });
    }

    logger.info(`Successfully updated ${results.length} submission(s)`);

    if (submissionIds.length === 1) {
      return res.status(200).json(results[0]);
    } else {
      return res.status(200).json({
        results,
        summary: {
          updated: results.length,
          autoFixed: autoFixedCount,
        },
      });
    }
  } catch (error: any) {
    logger.error(`Error occurred while updating submissions: ${error.message}`);
    return res.status(500).json({
      error: error.message,
      message: 'Error occurred while updating the submissions.',
    });
  }
}

export default withSponsorAuth(handler);
