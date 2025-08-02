import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';
import { getURL } from '@/utils/validUrl';

import { type NextApiRequestWithSponsor } from '@/features/auth/types';
import { checkListingSponsorAuth } from '@/features/auth/utils/checkListingSponsorAuth';
import { withSponsorAuth } from '@/features/auth/utils/withSponsorAuth';
import { SpamRejectionTemplate } from '@/features/emails/components/spamRejectionTemplate';
import { pratikEmail, replyToEmail } from '@/features/emails/utils/fromEmails';
import { resend } from '@/features/emails/utils/resend';

async function handler(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  const userId = req.userId;

  if (!userId) {
    logger.warn('Invalid token: User ID not found');
    return res.status(400).json({ error: 'Invalid token' });
  }

  logger.debug(`Request body: ${safeStringify(req.body)}`);
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    logger.warn('Missing or invalid ids parameter');
    return res.status(400).json({ error: 'ids array is required' });
  }

  try {
    const submissions = await prisma.submission.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      include: {
        user: {
          select: {
            firstName: true,
            email: true,
          },
        },
        listing: {
          select: {
            title: true,
            slug: true,
            type: true,
          },
        },
      },
    });

    if (submissions.length !== ids.length) {
      logger.warn(
        `Some submissions not found. Requested: ${ids.length}, Found: ${submissions.length}`,
      );
      return res.status(404).json({ error: 'Some submissions not found' });
    }

    // Verify all submissions are from the same listing and it's a project
    const listingId = submissions[0]?.listingId;
    if (!listingId || !submissions.every((s) => s.listingId === listingId)) {
      logger.warn('All submissions must be from the same listing');
      return res
        .status(400)
        .json({ error: 'All submissions must be from the same listing' });
    }

    if (submissions[0]?.listing?.type !== 'project') {
      logger.warn('This endpoint is only for project submissions');
      return res
        .status(400)
        .json({ error: 'This endpoint is only for project submissions' });
    }

    const { error } = await checkListingSponsorAuth(
      req.userSponsorId,
      listingId,
    );
    if (error) {
      return res.status(error.status).json({ error: error.message });
    }

    // Send merged spam rejection email for each submission
    for (const submission of submissions) {
      try {
        const listingUrl = `${getURL()}listing/${submission.listing?.slug}`;
        const spamDisputeUrl = `${getURL()}credits?dispute=${submission.id}`;

        await resend.emails.send({
          from: pratikEmail,
          to: [submission.user?.email!],
          subject: 'Your application was flagged as spam',
          react: SpamRejectionTemplate({
            firstName: submission.user?.firstName || 'there',
            listingName: submission.listing?.title || 'this project',
            listingUrl,
            spamDisputeUrl,
          }),
          replyTo: replyToEmail,
        });

        logger.info(
          `Spam rejection email sent for submission ${submission.id}`,
        );
      } catch (err) {
        logger.warn(
          `Failed to send spam rejection email for submission ${submission.id}:`,
          err,
        );
      }
    }

    return res
      .status(200)
      .json({ message: 'Spam rejection emails sent successfully' });
  } catch (error: any) {
    logger.error(
      `Error occurred while sending spam rejection emails: ${error.message}`,
    );
    return res.status(500).json({
      error: error.message,
      message: 'Error occurred while sending spam rejection emails.',
    });
  }
}

export default withSponsorAuth(handler);
