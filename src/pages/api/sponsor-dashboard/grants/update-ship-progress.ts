import type { NextApiRequest, NextApiResponse } from 'next';

import { withSponsorAuth } from '@/features/auth';
import { sendEmailNotification } from '@/features/emails';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import {
  airtableConfig,
  airtableUrl,
  fetchAirtableRecordId,
  updateAirtableRecord,
} from '@/utils/airtable';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { id } = req.body;

  if (!id || typeof id !== 'string') {
    logger.warn('Invalid request: ID is required and must be a string');
    return res
      .status(400)
      .json({ error: 'ID is required and must be a string' });
  }

  try {
    const application = await prisma.grantApplication.findUnique({
      where: { id },
      include: {
        grant: true,
      },
    });
    if (!application) {
      logger.warn('application not found with id ', id);
      return res.status(404).json({
        error: 'APPLICATION NOT FOUND',
        message: 'application not found',
      });
    }
    if (application.applicationStatus !== 'Approved') {
      logger.warn('Application is not approved');
      return res.status(400).json({
        error: 'Application is not approved',
        message: 'Application is not approved',
      });
    }
    if (application.grant.airtableId) {
      const config = airtableConfig(process.env.AIRTABLE_GRANTS_API_TOKEN!);
      const url = airtableUrl(
        process.env.AIRTABLE_GRANTS_BASE_ID!,
        process.env.AIRTABLE_RECIPIENTS_TABLE!,
      );

      const airtableRecordId = await fetchAirtableRecordId(
        url,
        'earnApplicationId',
        id,
        config,
      );
      if (!airtableRecordId) {
        logger.warn(
          'airtable recipient record not found with id ',
          id,
          ' and airtable record id',
          airtableRecordId,
        );
        return res.status(404).json({
          error: 'AIRTABLE RECIPIENTS NOT FOUND',
          message: 'Airtable record not found',
        });
      }
      const recordUrl = airtableUrl(
        process.env.AIRTABLE_GRANTS_BASE_ID!,
        process.env.AIRTABLE_RECIPIENTS_TABLE!,
        airtableRecordId,
      );

      const aritableApplication = {
        Status: 'Shipped',
      };

      await updateAirtableRecord(recordUrl, aritableApplication, config);
    } else {
      logger.info('Application doesnt have airtable id');
    }
  } catch (err) {
    logger.error('Error syncing with Airtable', err);
    return res.status(404).json({
      error: 'AIRTABLE RECIPIENT UPDATE FAILED',
      message: 'Airtable record update failed',
    });
  }

  try {
    const result = await prisma.grantApplication.update({
      where: { id },
      data: {
        applicationStatus: 'Completed',
      },
      include: {
        user: true,
        grant: true,
      },
    });

    if (!result) {
      logger.warn(`Grant application with ID ${id} not found`);
      return res.status(404).json({ error: 'Grant application not found' });
    }

    try {
      sendEmailNotification({
        type: 'grantCompleted',
        id: result.id,
        userId: result.user.id,
        triggeredBy: result.grant.pocId,
      });
    } catch (err) {
      logger.error(
        `Failed to send email for grant completed notification for application ID ${result.id}: ${err}`,
      );
    }

    return res.status(200).json(result);
  } catch (error: any) {
    logger.error(
      `Error updating grant application with ID ${id}: ${error.message}`,
    );
    return res.status(500).json({
      error: error.message,
      message: 'Error occurred while updating the grant application.',
    });
  }
}

export default withSponsorAuth(handler);
