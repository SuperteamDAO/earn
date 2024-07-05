import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  try {
    const result = await prisma.grantApplication.update({
      where: { id: id as string },
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
