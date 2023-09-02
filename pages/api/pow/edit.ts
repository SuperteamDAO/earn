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

    if (
      !userId ||
      typeof userId !== 'string' ||
      userId.trim() === '' ||
      userId.includes('*')
    ) {
      return res.status(400).json({
        error: 'Invalid or missing "userId".',
      });
    }

    const dataArray = Array.isArray(pows) ? pows : [pows];
    const createData: any[] = [];
    const updateData: any[] = [];

    const existingPoWs = await prisma.poW.findMany({
      where: {
        userId,
      },
      select: {
        id: true,
      },
    });
    const existingIds = existingPoWs.map((pow) => pow.id);

    const incomingIds = dataArray
      .filter((data) => data && data.id)
      .map((data) => data.id);

    const idsToDelete = existingIds.filter((id) => !incomingIds.includes(id));

    dataArray.forEach((data) => {
      if (!data) {
        errors.push('One of the data entries is undefined or null.');
      } else if (data.id) {
        updateData.push({
          where: { id: data.id },
          data: { ...data, userId },
        });
      } else {
        createData.push({ ...data, userId });
      }
    });

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    try {
      const results = await prisma.$transaction([
        prisma.poW.createMany({ data: createData }),
        ...updateData.map((data) => prisma.poW.update(data)),
        ...idsToDelete.map((id) => prisma.poW.delete({ where: { id } })),
      ]);

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
  } else {
    return res.status(405).end();
  }
}
