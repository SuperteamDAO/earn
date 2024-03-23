import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

import { prisma } from '@/prisma';

export default async function user(req: NextApiRequest, res: NextApiResponse) {
  const token = await getToken({ req });

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = token.id;

  if (!userId) {
    return res.status(400).json({ error: 'Invalid token' });
  }

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
