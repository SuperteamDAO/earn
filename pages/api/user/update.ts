import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function user(req: NextApiRequest, res: NextApiResponse) {
  const { id, ...updateAttributes } = req.body;
  try {
    const result = await prisma.user.update({
      where: {
        id,
      },
      data: {
        ...updateAttributes,
      },
      include: {
        currentSponsor: true,
      },
    });
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      error,
      message: `Error occurred while updating user ${id}.`,
    });
  }
}
