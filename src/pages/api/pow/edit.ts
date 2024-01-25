import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

import { prisma } from '@/prisma';

interface PoW {
  id?: string;
  userId: string;
  title: string;
  description: string;
  skills: string[];
  subSkills: string[];
  link: string;
  createdAt?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const { pows } = req.body as { pows: PoW[] };
  const errors: string[] = [];

  const token = await getToken({ req });

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = token.id;

  if (!userId) {
    return res.status(400).json({ error: 'Invalid token' });
  }

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

    const { id, ...otherFields } = pow;

    if (id) {
      updateData.push({
        where: { id },
        data: { ...otherFields, userId },
      });
    } else {
      createData.push({ ...otherFields, userId });
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
