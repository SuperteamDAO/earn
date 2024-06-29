import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import { prisma } from '@/prisma';

async function grant(req: NextApiRequestWithUser, res: NextApiResponse) {
  const params = req.query;
  const id = params.id as string;
  const updatedData = req.body;

  try {
    const userId = req.userId;

    const user = await prisma.user.findUnique({
      where: {
        id: userId as string,
      },
    });

    const grant = await prisma.grants.findUnique({
      where: { id },
    });

    if (!user) {
      return res
        .status(403)
        .json({ error: 'User does not have a current sponsor.' });
    }

    if (
      !user ||
      !user.currentSponsorId ||
      grant?.sponsorId !== user.currentSponsorId
    ) {
      return res
        .status(403)
        .json({ error: 'User does not have a current sponsor.' });
    }

    if (!grant) {
      return res
        .status(404)
        .json({ message: `Grant with id=${id} not found.` });
    }

    const result = await prisma.grants.update({
      where: { id },
      data: updatedData,
    });

    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      error,
      message: `Error occurred while updating grant with id=${id}.`,
    });
  }
}

export default withAuth(grant);
