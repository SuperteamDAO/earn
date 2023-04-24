import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function user(req: NextApiRequest, res: NextApiResponse) {
  const { publicKey } = req.body;
  try {
    const result = await prisma.user.findUnique({
      where: {
        publicKey,
      },
    });
    res.status(200).json(result);
  } catch (err) {
    console.log(err);
    res.status(403).json({ err: 'Error occured while adding a new food.' });
  }
}
