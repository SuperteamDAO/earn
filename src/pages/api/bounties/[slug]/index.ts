import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function user(req: NextApiRequest, res: NextApiResponse) {
  const params = req.query;
  const slug = params.slug as string;
  const type = params.type as 'bounty' | 'project' | 'hackathon';
  try {
    const result = await prisma.bounties.findFirst({
      where: {
        slug,
        type,
        isActive: true,
      },
      include: { sponsor: true, poc: true, Submission: true, Hackathon: true },
    });

    if (!result) {
      return res.status(404).json({
        message: `Bounty with slug=${slug} not found.`,
      });
    }

    const totalSubmissions = result.Submission.length;
    const winnersSelected = result.Submission.filter(
      (sub) => sub.isWinner,
    ).length;
    const paymentsMade = result.Submission.filter((sub) => sub.isPaid).length;
    return res
      .status(200)
      .json({ ...result, totalSubmissions, winnersSelected, paymentsMade });
  } catch (error) {
    return res.status(400).json({
      error,
      message: `Error occurred while fetching bounty with slug=${slug}.`,
    });
  }
}
