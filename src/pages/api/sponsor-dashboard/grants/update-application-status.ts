import axios from 'axios';
import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import { convertGrantApplicationToAirtable } from '@/features/grants';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { airtableConfig, airtableUpsert, airtableUrl } from '@/utils/airtable';
import { safeStringify } from '@/utils/safeStringify';

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  const userId = req.userId;

  if (!userId) {
    logger.warn('Invalid token: User ID is missing');
    return res.status(400).json({ error: 'Invalid token' });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    logger.warn(`User not found for ID: ${userId}`);
    return res.status(400).json({ error: 'User not found' });
  }

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

    if (user.currentSponsorId !== currentApplication.grant.sponsorId) {
      logger.warn(
        `Unauthorized access by user ID: ${userId} for sponsor ID: ${currentApplication.grant.sponsorId}`,
      );
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const updatedData: any = {
      applicationStatus,
    };

    if (applicationStatus === 'Approved') {
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

    if (applicationStatus === 'Approved') {
      await prisma.grants.update({
        where: { id: result.grantId },
        data: {
          totalApproved: {
            increment: parsedAmount,
          },
        },
      });
    }

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

export default withAuth(handler);
