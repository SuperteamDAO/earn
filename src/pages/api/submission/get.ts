import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

import { prisma } from '@/prisma';

export default async function submission(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const token = await getToken({ req });

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = token.id;

  if (!userId) {
    return res.status(400).json({ error: 'Invalid token' });
  }

  const id = req.query.id as string;

  try {
    const result = await prisma.submission.findFirst({
      where: {
        userId,
        listingId: id,
      },
    });

    return res.status(200).json(result);
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      error,
      message: 'Error occurred while getting the submission.',
    });
  }
}
