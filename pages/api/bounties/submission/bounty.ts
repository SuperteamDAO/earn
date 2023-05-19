import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function user(req: NextApiRequest, res: NextApiResponse) {
  const { submissionId, slug } = req.body;
  console.log(submissionId, slug, '-------');
  try {
    const result = await prisma.bounties.findFirst({
      where: {
        slug,
        isActive: true,
      },
      include: { sponsor: true, poc: true },
    });

    const submission = await prisma.submission.findUnique({
      where: {
        id: submissionId,
      },
      include: {
        user: true,
      },
    });
    res.status(200).json({
      bounty: result,
      submission,
    });
  } catch (error) {
    res.status(400).json({
      error,
      message: `Error occurred while fetching bounty with slug=${slug}.`,
    });
  }
}
