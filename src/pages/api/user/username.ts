import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function checkUsername(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).end(`Method Not Allowed`);
  }

  const { username } = req.query;

  if (!username || typeof username !== 'string') {
    return res
      .status(400)
      .json({ error: 'Username is required and must be a string.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (user) {
      return res.status(200).json({ available: false });
    }
    return res.status(200).json({ available: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: 'Error occurred while checking the username availability.',
    });
  }
}
