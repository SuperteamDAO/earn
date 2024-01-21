import type { Prisma } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

import { prisma } from '@/prisma';

export default async function user(req: NextApiRequest, res: NextApiResponse) {
  try {
    const token = await getToken({ req });

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = token;

    if (!id) {
      return res.status(400).json({ error: 'Invalid token' });
    }
    const { notification } = req.body as {
      notification: Prisma.InputJsonArray | undefined;
    };
    const result = await prisma.user.update({
      where: {
        id: id as string,
      },
      data: {
        notifications: notification?.length! > 0 ? notification : [],
      },
    });
    return res.status(200).json(result);
  } catch (err) {
    console.log(err);
    return res.status(400).json({ err: 'Error occurred' });
  }
}
