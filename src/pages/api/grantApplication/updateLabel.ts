import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import { prisma } from '@/prisma';

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  const userId = req.userId;

  if (!userId) {
    return res.status(400).json({ error: 'Invalid token' });
  }

  const { id, label } = req.body;

  try {
    const result = await prisma.grantApplication.update({
      where: {
        id,
      },
      data: {
        label,
      },
    });

    return res.status(200).json(result);
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      error,
      message: 'Error occurred while updating the grant application.',
    });
  }
}

export default withAuth(handler);
