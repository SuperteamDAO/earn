import axios from 'axios';
import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import { sendEmailNotification } from '@/features/emails';
import { convertGrantApplicationToAirtable } from '@/features/grants';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { airtableConfig, airtableUpsert, airtableUrl } from '@/utils/airtable';
import { dayjs } from '@/utils/dayjs';
import { safeStringify } from '@/utils/safeStringify';

async function grantApplication(
  req: NextApiRequestWithUser,
  res: NextApiResponse,
) {
  const userId = req.userId;

  logger.debug(`Request body: ${safeStringify(req.body)}`);

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
    answers,
  } = req.body;

  const formattedProjectTimeline = dayjs(projectTimeline).format('D MMMM YYYY');
  const parsedAsk = parseInt(ask, 10);

  try {
    logger.debug('Creating grant application in the database');
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
        answers,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            twitter: true,
            discord: true,
          },
        },
        grant: {
          select: {
            airtableId: true,
            isNative: true,
          },
        },
      },
    });

    if (result.grant.isNative === true && !result.grant.airtableId) {
      try {
        sendEmailNotification({
          type: 'application',
          id: result.id,
          userId: result?.userId,
          triggeredBy: userId,
        });
      } catch (err) {
        logger.error('Error sending email to User:', err);
      }
    }

    logger.info(
      `Grant application created successfully for user ID: ${userId}`,
    );
    logger.debug(`Grant application result: ${safeStringify(result)}`);

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

      logger.debug(`Airtable payload: ${safeStringify(airtablePayload)}`);

      await axios.patch(url, JSON.stringify(airtablePayload), config);
      logger.info('Airtable record updated successfully');
    }

    return res.status(200).json(result);
  } catch (error: any) {
    logger.error(
      `User ${userId} unable to apply for grant: ${safeStringify(error)}`,
    );
    if (error.response) {
      logger.error(`Response data: ${safeStringify(error.response.data)}`);
    }
    return res.status(400).json({
      error: error.message,
      message: 'Error occurred while adding a new grant application.',
    });
  }
}

export default withAuth(grantApplication);
