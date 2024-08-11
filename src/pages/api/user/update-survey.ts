import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  logger.debug(`Request body: ${safeStringify(req.body)}`);

  try {
    const userId = req.userId;
    const surveyId = req.body.surveyId as string;

    logger.debug(`Fetching user data for user ID: ${userId}`);
    const user = await prisma.user.findUnique({
      where: { id: userId as string },
    });

    if (!user) {
      logger.warn(`User not found for user ID: ${userId}`);
      return res.status(404).json({ error: 'User not found' });
    }

    let surveysShown = {};

    try {
      const parsedSurveysShown =
        typeof user.surveysShown === 'string'
          ? JSON.parse(user.surveysShown)
          : user.surveysShown;
      if (
        typeof parsedSurveysShown === 'object' &&
        parsedSurveysShown !== null
      ) {
        surveysShown = parsedSurveysShown;
      }
    } catch (error) {
      logger.error(
        `Failed to parse surveysShown for user ID: ${userId} - ${safeStringify(error)}`,
      );
    }

    const updatedSurveys = { ...surveysShown, [surveyId]: true };

    logger.debug(
      `Updating surveysShown for user ID: ${userId} with survey ID: ${surveyId}`,
    );
    await prisma.user.update({
      where: { id: userId as string },
      data: {
        surveysShown: updatedSurveys,
      },
    });

    logger.info(`Surveys shown updated successfully for user ID: ${userId}`);
    return res.status(200).json({ message: 'Success' });
  } catch (error: any) {
    logger.error(
      `Error occurred while processing the request for user ID: ${req.userId} - ${safeStringify(error)}`,
    );
    return res
      .status(500)
      .json({ error: 'Error occurred while processing the request.' });
  }
}

export default withAuth(handler);
