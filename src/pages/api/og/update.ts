import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { type, url, id } = req.body;

  try {
    if (type === 'submission') {
      await prisma.submission.update({
        where: { id: id as string },
        data: {
          ogImage: url,
        },
      });
    } else if (type === 'pow') {
      await prisma.poW.update({
        where: { id: id as string },
        data: {
          ogImage: url,
        },
      });
    }
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
}
