import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

import { prisma } from '@/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const token = await getToken({ req });

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const surveyId = req.body.surveyId as string;

    const userId = token.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

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
