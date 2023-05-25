import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function inviteUser(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const params = req.query;
  const invite = params.invite as string;
  try {
    const result = await prisma.userInvites.findUnique({
      where: {
        id: invite,
      },
      include: {
        sender: true,
      },
    });
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ err: 'Error occurred while getting the invite.' });
  }
}
