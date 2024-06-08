import axios from 'axios';
import dayjs from 'dayjs';
import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import { convertGrantApplicationToAirtable } from '@/features/grants';
import { prisma } from '@/prisma';
import { airtableConfig, airtableUpsert, airtableUrl } from '@/utils/airtable';

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
        ask,
      },
      include: {
        user: true,
        grant: true,
      },
    });

    if (result.grant.airtableId) {
      const config = airtableConfig(process.env.AIRTABLE_GRANTS_API_TOKEN!);
      const url = airtableUrl(
        process.env.AIRTABLE_GRANTS_BASE_ID!,
        process.env.AIRTABLE_GRANTS_TABLE_NAME!,
      );

      const airtableData = convertGrantApplicationToAirtable(result);
      const airtablePayload = airtableUpsert('earnGrantApplicationId', [
        { fields: airtableData },
      ]);

      await axios.patch(url, JSON.stringify(airtablePayload), config);
    }

    return res.status(200).json(result);
  } catch (error: any) {
    console.error(`User ${userId} unable to apply`, error.message);
    return res.status(400).json({
      error,
      message: 'Error occurred while adding a new grant application.',
    });
  }
}

export default withAuth(grantApplication);
