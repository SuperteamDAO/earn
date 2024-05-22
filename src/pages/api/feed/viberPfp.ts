import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function getAllUsers(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  try {
    const { id } = req.body;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        photo: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.status(200).json(user);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
