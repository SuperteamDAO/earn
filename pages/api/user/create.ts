import type { NextApiRequest, NextApiResponse } from 'next';
import { generateUsername } from 'unique-username-generator';

import { prisma } from '@/prisma';

export default async function user(req: NextApiRequest, res: NextApiResponse) {
  const { publicKey, email, firstName, lastName } = req.body;
  const username = generateUsername('-', 4, 24);
  try {
    const result = await prisma.user.create({
      data: {
        publicKey,
        email,
        firstName,
        lastName,
        username,
      },
    });
    res.status(200).json(result);
  } catch (error) {
    res.status(403).json({
      error,
      message: 'Error occured while adding a new user.',
    });
  }
}
