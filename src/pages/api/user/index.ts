import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function user(req: NextApiRequest, res: NextApiResponse) {
  try {
    const currentSponsorUser = await prisma.user.findUnique({
      where: {
        ...req.body,
      },
      select: {
        id: true,
        currentSponsorId: true,
      },
    });
    const where = currentSponsorUser?.currentSponsorId
      ? {
          UserSponsors: {
            where: {
              sponsorId: currentSponsorUser?.currentSponsorId,
            },
          },
        }
      : {};
    const result = await prisma.user.findUnique({
      where: {
        ...req.body,
      },
      include: {
        currentSponsor: true,
        ...where,
      },
    });
    res.status(200).json(result);
  } catch (err) {
    console.log(err);
    res.status(400).json({ err: 'Error occurred while adding a new food.' });
  }
}
