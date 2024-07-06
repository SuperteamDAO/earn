import axios from 'axios';
import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import { convertGrantApplicationToAirtable } from '@/features/grants';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { airtableConfig, airtableUpsert, airtableUrl } from '@/utils/airtable';
import { dayjs } from '@/utils/dayjs';

async function grantApplication(
  req: NextApiRequestWithUser,
  res: NextApiResponse,
) {
  const userId = req.userId;

  const {
    grantId,
    projectTitle,
    projectOneLiner,
    projectDetails,
    projectTimeline,
    proofOfWork,
    milestones,
    kpi,
    walletAddress,
    ask,
  } = req.body;

  const formattedProjectTimeline = dayjs(projectTimeline).format('D MMMM YYYY');

  const parsedAsk = parseInt(ask, 10);

  try {
    const result = await prisma.grantApplication.create({
      data: {
        userId: userId as string,
        grantId,
        projectTitle,
        projectOneLiner,
        projectDetails,
        projectTimeline: formattedProjectTimeline,
        proofOfWork,
        milestones,
        kpi,
        walletAddress,
        ask: parsedAsk,
      },
      include: {
        user: true,
        grant: true,
      },
    });

    logger.info('result:', result);

    if (result.grant.airtableId) {
      const config = airtableConfig(process.env.AIRTABLE_GRANTS_API_TOKEN!);
      const url = airtableUrl(
        process.env.AIRTABLE_GRANTS_BASE_ID!,
        process.env.AIRTABLE_GRANTS_TABLE_NAME!,
      );

      const airtableData = convertGrantApplicationToAirtable(result);
      const airtablePayload = airtableUpsert('earnApplicationId', [
        { fields: airtableData },
      ]);

      logger.info('Airtable payload:', airtablePayload);

      await axios.patch(url, JSON.stringify(airtablePayload), config);
    }

    return res.status(200).json(result);
  } catch (error: any) {
    logger.error(`User ${userId} unable to apply`, error.message);
    if (error.response) {
      logger.error('Response data:', error.response.data);
    }
    return res.status(400).json({
      error: error.message,
      message: 'Error occurred while adding a new grant application.',
    });
  }
}

export default withAuth(grantApplication);
