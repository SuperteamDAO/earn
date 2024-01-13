import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

import { prisma } from '@/prisma';

export default async function bountyDelete(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const params = req.query;
  const id = params.id as string;

  try {
    const token = await getToken({ req });

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = token.id;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'Invalid token' });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    const deleteBounty = await prisma.bounties.findFirst({
      where: {
        id,
      },
    });

    if (
      !user ||
      !user.currentSponsorId ||
      deleteBounty?.sponsorId !== user.currentSponsorId
    ) {
      return res
        .status(403)
        .json({ error: 'User does not have a current sponsor.' });
    }

    if (!deleteBounty) {
      return res
        .status(404)
        .json({ message: `Bounty with id=${id} not found.` });
    }

    if (!deleteBounty) {
      return res
        .status(400)
        .json({ message: `Bounty with id=${id} not found.` });
    }
    if (deleteBounty.status !== 'OPEN' || deleteBounty.isPublished) {
      return res
        .status(400)
        .json({ messsage: 'Only draft bounties can be deleted' });
    }

    await prisma.bounties.update({
      where: {
        id,
      },
      data: {
        isActive: false,
      },
    });

    return res.status(200).json({
      message: `Draft Bounty with id=${id} deleted successfully.`,
    });
  } catch (error) {
    return res.status(400).json({
      error,
      message: `Error occurred while deleting bounty with id=${id}.`,
    });
  }
}
