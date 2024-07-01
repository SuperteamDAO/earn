import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import { prisma } from '@/prisma';

async function grantDelete(req: NextApiRequestWithUser, res: NextApiResponse) {
  const params = req.query;
  const id = params.id as string;

  try {
    const userId = req.userId;

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    const deleteGrant = await prisma.grants.findFirst({
      where: {
        id,
      },
    });

    if (
      !user ||
      !user.currentSponsorId ||
      deleteGrant?.sponsorId !== user.currentSponsorId
    ) {
      return res
        .status(403)
        .json({ error: 'User does not have a current sponsor.' });
    }

    if (!deleteGrant) {
      return res
        .status(404)
        .json({ message: `Grant with id=${id} not found.` });
    }

    if (!deleteGrant) {
      return res
        .status(400)
        .json({ message: `Grant with id=${id} not found.` });
    }
    if (deleteGrant.status !== 'OPEN' || deleteGrant.isPublished) {
      return res
        .status(400)
        .json({ messsage: 'Only draft bounties can be deleted' });
    }

    await prisma.grants.update({
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

export default withAuth(grantDelete);
