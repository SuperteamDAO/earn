import { type BountyType } from '@prisma/client';
import { type NextApiRequest, type NextApiResponse } from 'next/types';

import { prisma } from '@/prisma';

export default async function slugHandler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const params = req.query;
  const slug = params.slug as string;
  const type = params.type as BountyType;
  if (!slug || !type || [slug, type].includes('undefined')) {
    return res.status(400).json({
      error: 'Missing parameters',
    });
  }
  const bounties = await prisma.bounties.findFirst({
    where: {
      slug,
    },
  });
  res.status(200).json({ slug, type, isAvailable: !bounties });
}
