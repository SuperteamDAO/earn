import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

import { prisma } from '@/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const token = await getToken({ req });

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userEmail = token.email;

    if (!userEmail) {
      return res.status(400).json({ error: 'Invalid token' });
    }

    const result = await prisma.user.findUnique({
      where: {
        email: userEmail,
      },
      include: {
        currentSponsor: true,
        UserSponsors: true,
        Hackathon: true,
        Submission: true,
        emailSettings: true,
      },
    });

    return res.status(200).json(result);
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ err: 'Error occurred while processing the request.' });
  }
}
