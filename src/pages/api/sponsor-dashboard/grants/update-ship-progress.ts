import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';

import { withSponsorAuth } from '@/features/auth';
import { sendEmailNotification } from '@/features/emails';
import { convertGrantApplicationToAirtable } from '@/features/grants';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { airtableConfig, airtableUpsert, airtableUrl } from '@/utils/airtable';

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
    const result = await prisma.grantApplication.update({
      where: { id },
      data: {
        isShipped: true,
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
      await sendEmailNotification({
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

    try {
      const config = airtableConfig(process.env.AIRTABLE_GRANTS_API_TOKEN!);
      const url = airtableUrl(
        process.env.AIRTABLE_GRANTS_BASE_ID!,
        process.env.AIRTABLE_GRANTS_TABLE_NAME!,
      );
      const aritableApplication = convertGrantApplicationToAirtable(result);

      const airtablePayload = airtableUpsert(
        'earnApplicationId',
        [aritableApplication].map((a) => ({ fields: a })),
      );

      await axios.patch(url, JSON.stringify(airtablePayload), config);
    } catch (err) {
      logger.error('Failed to update Airtable record: ', err);
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
