import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

interface PoW {
  id?: string;
  title: string;
  description: string;
  skills: string[];
  subSkills: string[];
  link: string;
  createdAt?: Date;
}

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  const { pows } = req.body as { pows: PoW[] };
  const userId = req.userId;
  const errors: string[] = [];

  logger.debug(`Request body: ${safeStringify(req.body)}`);

  if (!pows) {
    logger.warn('The "pows" field is missing in the request body');
    return res
      .status(400)
      .json({ error: 'The "pows" field is missing in the request body.' });
  }

  try {
    const incomingIds = pows.map((pow) => pow.id).filter(Boolean) as string[];

    const existingPoWs = await prisma.poW.findMany({
      where: {
        userId,
      },
      select: { id: true },
    });

    const existingIds = existingPoWs.map((pow) => pow.id);
    const idsToDelete = existingIds.filter((id) => !incomingIds.includes(id));

    const createData: { [key: string]: any }[] = [];
    const updateData: {
      where: { id: string };
      data: { [key: string]: any };
    }[] = [];

    for (const pow of pows) {
      if (!pow) {
        errors.push('One of the data entries is undefined or null.');
        continue;
      }

      const { id, title, description, skills, subSkills, link, createdAt } =
        pow;

      if (id) {
        if (existingIds.includes(id)) {
          updateData.push({
            where: { id },
            data: {
              title,
              description,
              skills,
              subSkills,
              link,
              createdAt,
            },
          });
        } else {
          errors.push(`PoW with id ${id} does not belong to user ${userId}`);
        }
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
      logger.warn(`Validation errors: ${errors.join(', ')}`);
      return res.status(400).json({ errors });
    }

    const transactionActions = [
      prisma.poW.createMany({ data: createData as any }),
      ...updateData.map((data) => prisma.poW.update(data)),
      ...idsToDelete.map((id) => prisma.poW.delete({ where: { id } })),
    ];

    await prisma.$transaction(transactionActions);
    logger.info(`Successfully processed PoWs for user ${userId}`);
    return res.status(200).json({ message: 'Success' });
  } catch (error: any) {
    logger.error(
      `Error processing PoWs for user ${userId}:`,
      safeStringify(error),
    );
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
