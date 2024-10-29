import axios from 'axios';
import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import { convertGrantApplicationToAirtable } from '@/features/grants';
import { extractTwitterUsername } from '@/features/talent';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { airtableConfig, airtableUpsert, airtableUrl } from '@/utils/airtable';
import { dayjs } from '@/utils/dayjs';
import { safeStringify } from '@/utils/safeStringify';
import { validateSolanaAddress } from '@/utils/validateSolAddress';

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
  let { twitter } = req.body;

  const walletValidation = validateSolanaAddress(walletAddress);

  if (!walletValidation.isValid) {
    return res.status(400).json({
      error: 'Invalid Wallet Address',
      message:
        walletValidation.error || 'Invalid Solana wallet address provided.',
    });
  }

  const formattedProjectTimeline = dayjs(projectTimeline).format('D MMMM YYYY');
  const parsedAsk = parseInt(ask, 10);

  if (twitter) {
    const username = extractTwitterUsername(twitter);
    twitter = `https://x.com/${username}` || null;
  }

  try {
    const prevApplication = await prisma.grantApplication.findFirst({
      where: {
        userId,
        grantId: grantId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
      },
    });

    if (!prevApplication) {
      return res.status(404).json({
        message: 'Application not found.',
      });
    }

    logger.debug('Updating grant application in the database');
    const result = await prisma.grantApplication.update({
      where: {
        id: prevApplication.id,
      },
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
        twitter,
        answers,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
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

    logger.info(
      `Grant application updated successfully with application ID: ${prevApplication.id} for user ID: ${userId}`,
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
