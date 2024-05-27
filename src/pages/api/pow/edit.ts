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
  const { pows } = req.body as { pows: PoW[] };
  const errors: string[] = [];

  const userId = req.userId;

  if (!pows) {
    return res
      .status(400)
      .json({ error: 'The "pows" field is missing in the request body.' });
  }

  const existingPoWs = await prisma.poW.findMany({
    where: { userId },
    select: { id: true },
  });

  const existingIds = existingPoWs.map((pow) => pow.id);
  const incomingIds = pows.map((pow) => pow.id).filter(Boolean) as string[];
  const idsToDelete = existingIds.filter((id) => !incomingIds.includes(id));

  const createData: { [key: string]: any }[] = [];
  const updateData: { where: { id: string }; data: { [key: string]: any } }[] =
    [];

  for (const pow of pows) {
    if (!pow) {
      errors.push('One of the data entries is undefined or null.');
      continue;
    }

    const { id, title, description, skills, subSkills, link, createdAt } = pow;

    if (id) {
      updateData.push({
        where: { id },
        data: {
          title,
          userId,
          description,
          skills,
          subSkills,
          link,
          createdAt,
        },
      });
    } else {
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
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  try {
    const transactionActions = [
      prisma.poW.createMany({ data: createData as any }),
      ...updateData.map((data) => prisma.poW.update(data)),
      ...idsToDelete.map((id) => prisma.poW.delete({ where: { id } })),
    ];

    const results = await prisma.$transaction(transactionActions);
    return res.status(200).json(results);
  } catch (error: any) {
    if (error.code) {
      return res.status(500).json({
        error: {
          code: error.code,
          message: error.message,
          meta: error.meta,
        },
      });
    }
    return res.status(500).json({ error });
  }
}

export default withAuth(handler);
