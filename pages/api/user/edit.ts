import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // eslint-disable-next-line
  const { id, email, publicKey, ...data } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'User ID is required.' });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id },
      data,
      select: {
        email: true,
        publicKey: true,
      },
    });

    return res.json(updatedUser);
  } catch (error: any) {
    console.error('Error updating user profile:', error.message);
    return res.status(500).json({ error: 'Error updating user profile.' });
  }
}
