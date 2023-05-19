import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function user(req: NextApiRequest, res: NextApiResponse) {
  const { userId, name, slug, logo, url, industry, twitter, bio } = req.body;
  try {
    const result = await prisma.sponsors.create({
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
    await prisma.userSponsors.create({
      data: {
        userId,
        sponsorId: result.id,
        role: 'ADMIN',
      },
    });
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        currentSponsorId: result.id,
      },
    });
    res.status(200).json(result);
  } catch (error) {
    console.log('file: create.ts:29 ~ user ~ error:', error);
    res.status(400).json({
      error,
      message: 'Error occurred while adding a new sponsor.',
    });
  }
}
