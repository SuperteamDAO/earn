import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';

async function user(req: NextApiRequestWithUser, res: NextApiResponse) {
  const userId = req.userId;

  const user = await prisma.user.findUnique({
    where: {
      id: userId as string,
    },
  });

  const { name, slug, logo, url, industry, twitter, bio, entityName } =
    req.body;

  try {
    if (user) {
      const result = await prisma.sponsors.update({
        where: {
          id: user.currentSponsorId!,
        },
        data: {
          name,
          slug,
          logo,
          url,
          industry,
          twitter,
          bio,
          entityName,
        },
      });
      return res.status(200).json(result);
    } else {
      return res.status(400).json({
        message: 'Error occurred while updating sponsor.',
      });
    }
  } catch (error) {
    logger.error('file: ~ user ~ error:', error);
    return res.status(400).json({
      error,
      message: 'Error occurred while updating sponsor.',
    });
  }
}

export default withAuth(user);
