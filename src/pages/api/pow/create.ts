import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import { prisma } from '@/prisma';

interface PoW {
  id?: string;
  userId: string;
  title: string;
  description: string;
  skills: string[];
  subSkills: string[];
  link: string;
  createdAt?: Date;
}

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  const userId = req.userId;
  const { pows } = req.body as { pows: PoW[] };
  const errors: string[] = [];

  if (!pows) {
    return res.status(400).json({
      error: 'The "pows" field is missing in the request body.',
    });
  }

  if (!userId) {
    return res.status(400).json({
      error: 'The user is not authenticated.',
    });
  }

  const dataArray = Array.isArray(pows) ? pows : [pows];
  const createData: PoW[] = [];

  dataArray.forEach((pow) => {
    if (!pow) {
      errors.push('One of the data entries is undefined or null.');
    } else {
      const { title, description, skills, subSkills, link, createdAt } = pow;
      createData.push({
        title,
        userId,
        description,
        skills,
        subSkills,
        link,
        createdAt,
      });
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
