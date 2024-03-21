import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { slug } = req.query;

  const listing = await prisma.bounties.findUnique({
    where: {
      slug: slug as string,
    },
  });

  if (listing) {
    return res.status(409).json({ error: 'Slug already exists' });
  } else {
    return res.status(200).json({ message: 'Slug is unique' });
  }
}
