import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function user(req: NextApiRequest, res: NextApiResponse) {
  const { id, ...updateAttributes } = req.body;
  console.log('file: update.ts:7 ~ user ~ updateAttributes:', updateAttributes);
  try {
    const result = await prisma.user.update({
      where: {
        id,
      },
      data: {
        ...updateAttributes,
      },
    });
    res.status(200).json(result);
  } catch (error) {
    console.log('file: update.ts:19 ~ user ~ error:', error);
    res.status(403).json({
      error,
      message: `Error occured while updating user ${id}.`,
    });
  }
}
