import type { NextApiRequest, NextApiResponse } from 'next';

import { type ListingPageSubmission } from '@/interface/submission';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { convertDatesToISO, safeStringify } from '@/utils/safeStringify';

import { publicListingDetailsSelect } from '@/features/listings/constants/publicListingDetails';
import { type PublicListingDetails } from '@/features/listings/types';

const sortSubmissions = (
  a: { readonly winnerPosition: number | null; readonly createdAt: Date },
  b: { readonly winnerPosition: number | null; readonly createdAt: Date },
) => {
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
): Promise<{
  bounty: PublicListingDetails | null;
  submission: ListingPageSubmission[];
}> {
  const bounty = await prisma.bounties.findFirst({
    where: {
      slug,
      isActive: true,
      isPublished: true,
      isArchived: false,
    },
    select: publicListingDetailsSelect,
  });

  if (!bounty) {
    return { bounty: null, submission: [] };
  }

  const publicBounty = convertDatesToISO(
    bounty,
  ) as unknown as PublicListingDetails;

  if (bounty.isWinnersAnnounced === false) {
    return { bounty: publicBounty, submission: [] };
  }

  const submission = await prisma.submission.findMany({
    where: {
      listingId: bounty.id,
      ...(isWinner ? { isWinner } : {}),
    },
    select: {
      id: true,
      link: true,
      isWinner: true,
      winnerPosition: true,
      like: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          photo: true,
          username: true,
        },
      },
    },
  });

  submission.sort(sortSubmissions);

  const publicSubmissions: ListingPageSubmission[] = submission.map(
    ({ createdAt: _, ...item }) => ({
      ...item,
      link: item.link ?? undefined,
      winnerPosition: item.winnerPosition ?? undefined,
      like: item.like ?? undefined,
      user: {
        id: item.user.id,
        firstName: item.user.firstName ?? undefined,
        lastName: item.user.lastName ?? undefined,
        photo: item.user.photo ?? undefined,
        username: item.user.username ?? undefined,
      },
    }),
  );

  return { bounty: publicBounty, submission: publicSubmissions };
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
    return res.status(200).json({ submission });
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
