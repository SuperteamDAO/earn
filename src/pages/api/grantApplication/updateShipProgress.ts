import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.body;

  try {
    const result = await prisma.grantApplication.update({
      where: {
        id,
      },
      data: {
        isShipped: true,
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

export default handler;
