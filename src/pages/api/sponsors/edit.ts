import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

import { prisma } from '@/prisma';

export default async function user(req: NextApiRequest, res: NextApiResponse) {
  const token = await getToken({ req });

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = token.id;

  if (!userId) {
    return res.status(400).json({ error: 'Invalid token' });
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId as string,
    },
  });

  const { name, slug, logo, url, industry, twitter, bio } = req.body;

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
        },
      });
      return res.status(200).json(result);
    } else {
      return res.status(400).json({
        message: 'Error occurred while updating sponsor.',
      });
    }
  } catch (error) {
    console.log('file: ~ user ~ error:', error);
    return res.status(400).json({
      error,
      message: 'Error occurred while updating sponsor.',
    });
  }
}
