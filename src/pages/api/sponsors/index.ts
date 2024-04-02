import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import { prisma } from '@/prisma';

async function user(req: NextApiRequestWithUser, res: NextApiResponse) {
  const userId = req.userId;

  const user = await prisma.user.findUnique({
    where: {
      id: userId as string,
    },
    include: {
      currentSponsor: true,
    },
  });

  if (user) {
    return res.status(200).json(user.currentSponsor);
  } else {
    return res.status(400).json({
      message: 'Error occurred while fetching user.',
    });
  }
}

export default withAuth(user);
