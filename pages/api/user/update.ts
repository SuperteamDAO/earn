import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function user(req: NextApiRequest, res: NextApiResponse) {
  const { id, isVerified } = req.body;
  try {
    const result = await prisma.user.update({
      where: {
        id,
      },
      data: {
        isVerified,
      },
    });
    res.status(200).json(result);
  } catch (error) {
    res.status(403).json({
      error,
      message: `Error occured while updating user ${id}.`,
    });
  }
}
