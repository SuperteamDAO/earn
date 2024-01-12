import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method, query } = req;

  if (method === 'GET') {
    const userId = query.userId as string;

    if (!userId) {
      return res.status(400).json({
        error: 'The "userId" query parameter is missing.',
      });
    }

    try {
      const pows = await prisma.poW.findMany({
        where: {
          userId,
        },
      });

      if (!pows || pows.length === 0) {
        return res.status(404).json({
          error: 'No poWs found for the provided userId',
        });
      }

      return res.status(200).json(pows);
    } catch (error: any) {
      return res.status(500).json({
        error: `An error occurred while fetching the data: ${error.message}`,
      });
    }
  } else {
    return res.status(405).end();
  }
}
