import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import { prisma } from '@/prisma';

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  try {
    const userId = req.userId;

    const surveyId = req.body.surveyId as string;

    const user = await prisma.user.findUnique({
      where: { id: userId as string },
    });

    let surveysShown = {};

    try {
      const parsedSurveysShown =
        typeof user?.surveysShown === 'string'
          ? JSON.parse(user?.surveysShown)
          : user?.surveysShown;
      if (
        typeof parsedSurveysShown === 'object' &&
        parsedSurveysShown !== null
      ) {
        surveysShown = parsedSurveysShown;
      }
    } catch (error) {
      console.error('Failed to parse surveysShown:', error);
    }

    const updatedSurveys = { ...surveysShown, [surveyId]: true };

    const updatedUser = await prisma.user.update({
      where: { id: userId as string },
      data: {
        surveysShown: updatedSurveys,
      },
    });

    return res.status(200).json(updatedUser);
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ err: 'Error occurred while processing the request.' });
  }
}

export default withAuth(handler);
