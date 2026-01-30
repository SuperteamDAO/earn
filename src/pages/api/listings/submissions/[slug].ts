import type { NextApiRequest, NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { type SubmissionModel } from '@/prisma/models/Submission';
import { safeStringify } from '@/utils/safeStringify';

const sortSubmissions = (a: SubmissionModel, b: SubmissionModel) => {
  if (a.winnerPosition && b.winnerPosition) {
    return (
      (Number(a.winnerPosition) || Number.MAX_VALUE) -
      (Number(b.winnerPosition) || Number.MAX_VALUE)
    );
  }

  if (a.winnerPosition && !b.winnerPosition) {
    return -1;
  }

  if (!a.winnerPosition && b.winnerPosition) {
    return 1;
  }
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
};

export async function getSubmissionsData(
  slug: string,
  isWinner: boolean = false,
) {
  const bounty = await prisma.bounties.findFirst({
    where: {
      slug,
      isActive: true,
    },
    include: {
      sponsor: {
        select: {
          name: true,
          logo: true,
          isVerified: true,
        },
      },
      poc: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      Hackathon: {
        select: {
          altLogo: true,
        },
      },
    },
  });

  if (!bounty) {
    return { bounty: null, submission: [] };
  }

  if (bounty.isWinnersAnnounced === false) {
    return { bounty, submission: [] };
  }

  const submission = await prisma.submission.findMany({
    where: {
      listingId: bounty.id,
      ...(isWinner ? { isWinner } : {}),
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          photo: true,
          username: true,
          walletAddress: true,
        },
      },
    },
  });

  submission.sort(sortSubmissions);

  return { bounty, submission };
}

export default async function user(req: NextApiRequest, res: NextApiResponse) {
  const params = req.query;
  const slug = params.slug as string;
  const isWinner = params.isWinner === 'true';

  logger.debug(`Request query: ${safeStringify(req.query)}`);

  try {
    logger.debug(`Fetching bounty with slug: ${slug}`);
    const { bounty, submission } = await getSubmissionsData(slug, isWinner);

    if (!bounty) {
      logger.warn(`No bounty found with slug: ${slug}`);
      return res.status(404).json({
        message: `No bounty found with slug=${slug}.`,
      });
    }

    logger.info(
      `Successfully fetched bounty and submissions for slug: ${slug}`,
    );
    return res.status(200).json({
      bounty,
      submission,
    });
  } catch (error: any) {
    logger.error(
      `Error occurred while fetching bounty with slug=${slug}: ${safeStringify(error)}`,
    );
    return res.status(400).json({
      error: error.message,
      message: `Error occurred while fetching bounty with slug=${slug}.`,
    });
  }
}
