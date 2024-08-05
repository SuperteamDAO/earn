import axios from 'axios';
import type { NextApiResponse } from 'next';

import {
  checkGrantSponsorAuth,
  type NextApiRequestWithSponsor,
  withSponsorAuth,
} from '@/features/auth';
import { sendEmailNotification } from '@/features/emails';
import { convertGrantApplicationToAirtable } from '@/features/grants';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { airtableConfig, airtableUpsert, airtableUrl } from '@/utils/airtable';
import { safeStringify } from '@/utils/safeStringify';

async function handler(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  const userId = req.userId;

  logger.debug(`Request body: ${safeStringify(req.body)}`);

  const { id, applicationStatus, approvedAmount } = req.body;

  if (!id || !applicationStatus) {
    logger.warn('Missing required fields: id or applicationStatus');
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const parsedAmount = approvedAmount ? parseInt(approvedAmount, 10) : 0;

  try {
    const currentApplication = await prisma.grantApplication.findUnique({
      where: { id },
      include: {
        grant: true,
        user: true,
      },
    });

    if (!currentApplication) {
      logger.warn(`Grant application not found for ID: ${id}`);
      return res.status(404).json({ error: 'Grant application not found' });
    }

    const { error } = await checkGrantSponsorAuth(
      req.userSponsorId,
      currentApplication.grantId,
    );
    if (error) {
      return res.status(error.status).json({ error: error.message });
    }

    const updatedData: any = {
      applicationStatus,
    };

    const isApproved = applicationStatus === 'Approved';

    if (isApproved) {
      updatedData.approvedAmount = parsedAmount;
    }

    const result = await prisma.grantApplication.update({
      where: { id },
      data: updatedData,
      include: {
        user: true,
        grant: true,
      },
    });

    if (isApproved) {
      await prisma.grants.update({
        where: { id: result.grantId },
        data: {
          totalApproved: {
            increment: parsedAmount,
          },
        },
      });
    }

    if (result.grant.isNative === true && !result.grant.airtableId) {
      try {
        await sendEmailNotification({
          type: isApproved ? 'grantApproved' : 'grantRejected',
          id,
          userId: result.userId,
          triggeredBy: userId,
        });
      } catch (err) {
        logger.error('Error sending email to Sponsor:', err);
      }
    } else {
      const config = airtableConfig(process.env.AIRTABLE_GRANTS_API_TOKEN!);
      const url = airtableUrl(
        process.env.AIRTABLE_GRANTS_BASE_ID!,
        process.env.AIRTABLE_GRANTS_TABLE_NAME!,
      );

      const airtableData = convertGrantApplicationToAirtable(result);
      const airtablePayload = airtableUpsert('earnApplicationId', [
        { fields: airtableData },
      ]);

      await axios.patch(url, JSON.stringify(airtablePayload), config);
    }

    return res.status(200).json(result);
  } catch (error: any) {
    logger.error(
      `Error occurred while updating grant application ID: ${id} by user ID: ${userId}: ${error.message}`,
    );
    return res.status(500).json({
      error: error.message,
      message: 'Error occurred while updating the grant application.',
    });
  }
}

export default withSponsorAuth(handler);
