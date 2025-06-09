import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithSponsor } from '@/features/auth/types';
import { checkGrantSponsorAuth } from '@/features/auth/utils/checkGrantSponsorAuth';
import { withSponsorAuth } from '@/features/auth/utils/withSponsorAuth';

async function handler(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  const userId = req.userId;

  if (!userId) {
    logger.warn('Invalid token: User ID not found');
    return res.status(400).json({ error: 'Invalid token' });
  }

  logger.debug(`Request body: ${safeStringify(req.body)}`);
  const { id, ids, label } = req.body;

  const applicationIds = ids ? ids : id ? [id] : [];

  if (!applicationIds.length || !label) {
    logger.warn('Missing parameters: id/ids and label are required');
    return res.status(400).json({ error: 'id/ids and label are required' });
  }

  if (applicationIds.length > 1 && !['Spam', 'Shortlisted'].includes(label)) {
    logger.warn(`Multiple applications not allowed for label: ${label}`);
    return res.status(400).json({
      error:
        'Multiple applications only allowed for Spam and Shortlisted labels',
    });
  }

  try {
    const currentApplications = await prisma.grantApplication.findMany({
      where: { id: { in: applicationIds } },
    });

    if (currentApplications.length !== applicationIds.length) {
      const foundIds = currentApplications.map((a) => a.id);
      const missingIds = applicationIds.filter(
        (id: string) => !foundIds.includes(id),
      );
      logger.warn(`Applications not found: ${missingIds.join(', ')}`);
      return res.status(404).json({
        message: `Applications not found: ${missingIds.join(', ')}`,
      });
    }

    if (currentApplications.length === 0) {
      logger.warn('No applications found');
      return res.status(404).json({
        message: 'No applications found',
      });
    }

    const userSponsorId = req.userSponsorId;
    const firstApplication = currentApplications[0]!;

    const { error } = await checkGrantSponsorAuth(
      userSponsorId,
      firstApplication.grantId,
    );
    if (error) {
      return res.status(error.status).json({ error: error.message });
    }

    const differentGrants = currentApplications.filter(
      (a) => a.grantId !== firstApplication.grantId,
    );
    if (differentGrants.length > 0) {
      logger.warn('Applications belong to different grants');
      return res.status(400).json({
        error: 'All applications must belong to the same grant',
      });
    }

    const results = [];

    for (const application of currentApplications) {
      logger.debug(
        `Updating application with ID: ${application.id} and label: ${label}`,
      );

      const result = await prisma.grantApplication.update({
        where: { id: application.id },
        data: { label },
      });

      results.push(result);
    }

    logger.info(`Successfully updated ${results.length} application(s)`);

    if (applicationIds.length === 1) {
      return res.status(200).json(results[0]);
    } else {
      return res.status(200).json({
        results,
        summary: {
          updated: results.length,
        },
      });
    }
  } catch (error: any) {
    logger.error(
      `Error occurred while updating applications: ${error.message}`,
    );
    return res.status(500).json({
      error: error.message,
      message: 'Error occurred while updating the applications.',
    });
  }
}

export default withSponsorAuth(handler);
