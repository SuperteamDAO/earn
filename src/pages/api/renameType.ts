import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const updateOpenBounties = prisma.bounties.updateMany({
      where: { type: 'open' },
      data: { type: 'bounty' },
    });

    const updatePermissionedBounties = prisma.bounties.updateMany({
      where: { type: 'permissioned' },
      data: { type: 'project' },
    });

    await Promise.all([updateOpenBounties, updatePermissionedBounties]);

    res.status(200).json({ message: 'Bounties updated successfully' });
  } catch (error) {
    console.error('Request error', error);
    res.status(500).json({ error: 'Error updating bounties' });
  }
}
