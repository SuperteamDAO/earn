import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function bountyDelete(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const params = req.query;
  const id = params.id as string;

  try {
    const deleteBounty = await prisma.bounties.findFirst({
      where: {
        id,
      },
    });

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
