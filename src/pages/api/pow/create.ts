import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import { prisma } from '@/prisma';

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  const userId = req.userId;
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
}

export default withAuth(handler);
