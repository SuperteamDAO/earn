import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

import { prisma } from '@/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  if (method === 'POST') {
    const token = await getToken({ req });

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = token.id;

    if (!userId) {
      return res.status(400).json({ error: 'Invalid token' });
    }

    const { pows } = req.body;
    const errors: string[] = [];

    if (!pows) {
      return res.status(400).json({
        error: 'The "pows" field is missing in the request body.',
      });
    }

    const dataArray = Array.isArray(pows) ? pows : [pows];
    const createData: any[] = [];

    dataArray.forEach((data) => {
      if (!data) {
        errors.push('One of the data entries is undefined or null.');
      } else {
        createData.push({ ...data, userId });
      }
    });

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    try {
      const results = await prisma.poW.createMany({ data: createData });
      return res.status(200).json(results);
    } catch (error) {
      return res.status(500).json({
        error,
      });
    }
  } else {
    return res.status(405).end();
  }
}
