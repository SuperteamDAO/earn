import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function getHackathon(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const params = req.query;
  const hackathonSlug = params.slug as string;

  try {
    const hackathon = await prisma.hackathon.findUnique({
      where: { slug: hackathonSlug },
    });

    if (!hackathon) {
      return res.status(404).json({ error: 'Hackathon not found.' });
    }

    res.status(200).json(hackathon);
  } catch (err) {
    res.status(400).json({ err: err });
  }
}
