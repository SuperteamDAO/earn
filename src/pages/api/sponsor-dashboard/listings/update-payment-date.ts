import { type NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithSponsor } from '@/features/auth/types';
import { checkListingSponsorAuth } from '@/features/auth/utils/checkListingSponsorAuth';
import { withSponsorAuth } from '@/features/auth/utils/withSponsorAuth';

interface UpdatePaymentDateRequest {
  submissionId: string;
  listingId: string;
  paymentDate: string;
}

async function handler(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  const userSponsorId = req.userSponsorId;

  try {
    logger.debug(`Request body: ${safeStringify(req.body)}`);
    const { submissionId, listingId, paymentDate } =
      req.body as UpdatePaymentDateRequest;

    if (!listingId || !submissionId || !paymentDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { error } = await checkListingSponsorAuth(userSponsorId, listingId);
    if (error) {
      return res.status(error.status).json({ error: error.message });
    }

    const submission = await prisma.submission.findUnique({
      where: {
        id: submissionId,
      },
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    if (!submission.isPaid) {
      return res
        .status(400)
        .json({ error: 'Submission is not marked as paid' });
    }

    const updatedSubmission = await prisma.submission.update({
      where: {
        id: submissionId,
      },
      data: {
        paymentDate: new Date(paymentDate),
      },
    });

    logger.info(
      `Updated payment date for submission ID: ${submissionId} to ${paymentDate}`,
    );

    return res.status(200).json({ submission: updatedSubmission });
  } catch (err: any) {
    logger.error(
      `Error updating payment date: ${userSponsorId}: ${err.message}`,
    );
    res.status(400).json({
      error: `Error updating payment date`,
    });
  }
}

export default withSponsorAuth(handler);
