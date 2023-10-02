import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  if (method === 'POST') {
    const { userId, pows } = req.body;
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
