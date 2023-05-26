import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function user(req: NextApiRequest, res: NextApiResponse) {
  const { id, addUserSponsor, memberType, ...updateAttributes } = req.body;
  let result;
  try {
    result = await prisma.user.update({
      where: {
        id,
      },
      data: {
        ...updateAttributes,
      },
      include: {
        currentSponsor: true,
      },
    });
  } catch (error) {
    res.status(400).json({
      error,
      message: `Error occurred while updating user ${id}.`,
    });
  }
  try {
    if (addUserSponsor && updateAttributes?.currentSponsorId) {
      await prisma.userSponsors.create({
        data: {
          userId: id,
          sponsorId: updateAttributes?.currentSponsorId,
          role: memberType,
        },
      });
    }
  } catch (e) {
    console.log('file: update.ts:29 ~ user ~ e:', e);
  }
  res.status(200).json(result);
}
