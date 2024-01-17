import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const params = req.query;
  const slug = params.slug as string;

  // const searchText = params.searchText as string;
  // const skip = params.take ? parseInt(params.skip as string, 10) : 0;
  // const take = params.take ? parseInt(params.take as string, 10) : 15;

  // const whereSearch = searchText
  //   ? {
  //       title: {
  //         contains: searchText,
  //       },
  //     }
  //   : {};

  try {
    const bountyWithSubmissions = await prisma.bounties.findFirst({
      where: {
        slug,
        isActive: true,
      },
      include: {
        sponsor: true,
        poc: true,
        Submission: {
          where: {
            isActive: true,
            isArchived: false,
          },
          include: {
            user: true,
          },
          orderBy: { updatedAt: 'desc' },
        },
      },
    });

    if (!bountyWithSubmissions) {
      return res.status(404).json({
        message: `Bounty with slug=${slug} not found.`,
      });
    }

    const totalSubmissions = bountyWithSubmissions.Submission.length;
    const winnersSelected = bountyWithSubmissions.Submission.filter(
      (sub) => sub.isWinner,
    ).length;
    const paymentsMade = bountyWithSubmissions.Submission.filter(
      (sub) => sub.isPaid,
    ).length;

    return res.status(200).json({
      ...bountyWithSubmissions,
      totalSubmissions,
      winnersSelected,
      paymentsMade,
    });
  } catch (error) {
    return res.status(400).json({
      error,
      message: `Error occurred while fetching bounty with slug=${slug}.`,
    });
  }
}
