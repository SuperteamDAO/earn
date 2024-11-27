import { type NextApiResponse } from 'next';

import {
  checkListingSponsorAuth,
  type NextApiRequestWithSponsor,
  withSponsorAuth,
} from '@/features/auth';
import { sendEmailNotification } from '@/features/emails';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';

const MAX_RECORDS = 10;

async function handler(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  logger.debug(`Request body: ${JSON.stringify(req.body)}`);

  const { data } = req.body as {
    data: {
      id: string;
    }[];
  };

  if (!data) {
    logger.warn('Missing required fields: data');
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (data.length === 0) {
    logger.warn('Data asked to update is empty');
    return res.status(400).json({ error: 'Data asked to update is empty' });
  }
  if (data.length > MAX_RECORDS) {
    logger.warn('Only max 10 records allowed in data');
    return res
      .status(400)
      .json({ error: 'Only max 10 records allowed in data' });
  }

  try {
    const currentSubmissions = await prisma.submission.findMany({
      where: {
        id: {
          in: data.map((d) => d.id),
        },
      },
      include: {
        listing: true,
      },
    });

    if (currentSubmissions.length !== data.length) {
      logger.warn(
        `Some records were not found in the data - only found these - ${currentSubmissions.map((c) => c.id)}`,
      );
      return res.status(404).json({
        error: `Some records were not found in the data - only found these - ${currentSubmissions.map((c) => c.id)}`,
      });
    }

    const listingId = currentSubmissions[0]?.listingId;
    if (
      listingId &&
      !currentSubmissions.every(
        (application) => application.listingId === listingId,
      )
    ) {
      logger.warn('All records should have same and valid grant ID');
      return res
        .status(404)
        .json({ error: 'All records should have same and valid grant ID' });
    }

    currentSubmissions.forEach(async (currentApplicant) => {
      const { error } = await checkListingSponsorAuth(
        req.userSponsorId,
        currentApplicant.listingId,
      );
      if (error) {
        return res.status(error.status).json({ error: error.message });
      }
    });

    const result = await prisma.submission.updateMany({
      where: {
        id: {
          in: data.map((d) => d.id),
        },
      },
      data: {
        status: 'Rejected',
      },
    });

    for (const submission of currentSubmissions) {
      try {
        sendEmailNotification({
          type: 'submissionRejected',
          id: submission.id,
          userId: submission.userId,
          triggeredBy: req.userId,
        });
      } catch (err) {
        logger.warn(
          'Failed to send email notification for submission rejection for submission: ',
          submission.id,
        );
      }
    }

    return res.status(200).json(result);
  } catch (error: any) {
    logger.error(
      `Error occurred while rejecting listing submission ID: ${data.map((c) => c.id)}:  ${error.message}`,
    );
    return res.status(500).json({
      error: error.message,
      message: 'Error occurred while rejecting listing submissions',
    });
  }
}

export default withSponsorAuth(handler);
