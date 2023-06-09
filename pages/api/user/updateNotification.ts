import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function user(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id, notification } = req.body;
    const result = await prisma.user.update({
      where: {
        id: id as string,
      },
      data: {
        notifications: notification,
      },
    });
    res.status(200).json(result);
  } catch (err) {
    console.log(err);
    res.status(400).json({ err: 'Error occurred while adding a new food.' });
  }
}
