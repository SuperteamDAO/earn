// activity feed
import { type Prisma } from '@prisma/client';
import { type NextApiRequest, type NextApiResponse } from 'next';

import { type FeedPostType } from '@/features/feed';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { dayjs } from '@/utils/dayjs';
import { safeStringify } from '@/utils/safeStringify';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  logger.debug(`Request query: ${safeStringify(req.query)}`);
  const {
    timePeriod,
    take = 15,
    skip = 0,
    isWinner,
    filter,
    userId,
  } = req.query;

  const highlightType = req.query.highlightType as FeedPostType;
  let highlightId = req.query.highlightId as string | undefined;
  if (Number(skip) !== 0) highlightId = undefined;
  const takeOnlyType = req.query.takeOnlyType as FeedPostType | undefined;

  try {
    const winnerFilter =
      isWinner === 'true'
        ? {
            AND: [
              { isWinner: true },
              { listing: { isWinnersAnnounced: true } },
            ],
          }
        : {};

    let startDate: Date | undefined;
    const endDate: Date = new Date();

    switch (timePeriod) {
      case 'this week':
        startDate = dayjs().subtract(7, 'day').toDate();
        break;
      case 'this month':
        startDate = dayjs().subtract(30, 'day').toDate();
        break;
      case 'this year':
        startDate = dayjs().subtract(365, 'day').toDate();
        break;
      default:
        startDate = undefined;
        break;
    }

    const commentsWhere: Prisma.CommentFindManyArgs['where'] = {
      isActive: true,
      isArchived: false,
      replyToId: null,
    };

    const commentsInclude: Prisma.CommentFindManyArgs = {
      where: commentsWhere,
      orderBy: {
        createdAt: 'desc',
      },
      take: 3,
      select: {
        author: {
          select: {
            photo: true,
            firstName: true,
          },
        },
      },
    };

    const commentsCountInclude: Prisma.CommentFindManyArgs = {
      where: commentsWhere,
    };

    logger.debug(`Fetching submissions from ${startDate} to ${endDate}`);
    const submissionInclude: Prisma.SubmissionInclude = {
      user: {
        select: {
          firstName: true,
          lastName: true,
          photo: true,
          username: true,
        },
      },
      listing: {
        select: {
          id: true,
          title: true,
          rewards: true,
          type: true,
          slug: true,
          isWinnersAnnounced: true,
          token: true,
          sponsor: {
            select: {
              name: true,
              logo: true,
            },
          },
          winnersAnnouncedAt: true,
        },
      },
      Comments: commentsInclude,
      _count: {
        select: {
          Comments: commentsCountInclude,
        },
      },
    };
    const submissions =
      !takeOnlyType || (takeOnlyType && takeOnlyType === 'submission')
        ? await prisma.submission.findMany({
            where: {
              createdAt: {
                ...(startDate ? { gte: startDate } : {}),
                lte: endDate,
              },
              ...winnerFilter,
              listing: {
                isPrivate: false,
              },
              ...(userId ? { userId: userId as string } : {}),
            },
            skip: parseInt(skip as string, 10),
            take: parseInt(take as string, 10),
            orderBy:
              filter === 'popular'
                ? [{ likeCount: 'desc' }, { createdAt: 'desc' }]
                : { createdAt: 'desc' },
            include: submissionInclude,
          })
        : [];

    const submissionHighlighted =
      !submissions.find((s) => s.id === highlightId) &&
      !!highlightId &&
      highlightType === 'submission'
        ? await prisma.submission.findUnique({
            where: {
              id: highlightId,
              ...(userId ? { userId: userId as string } : {}),
            },
            include: submissionInclude,
          })
        : null;
    if (submissionHighlighted) {
      submissions.unshift(submissionHighlighted);
    }

    logger.debug('Fetching PoWs');
    const poWInclude: Prisma.PoWInclude = {
      user: {
        select: {
          firstName: true,
          lastName: true,
          photo: true,
          username: true,
        },
      },
      Comments: commentsInclude,
      _count: {
        select: {
          Comments: commentsCountInclude,
        },
      },
    };
    type PoWWithUserAndCommentsCount = Prisma.PoWGetPayload<{
      include: typeof poWInclude;
    }>;
    let pow: PoWWithUserAndCommentsCount[] = [];
    if (isWinner !== 'true') {
      pow =
        !takeOnlyType || (takeOnlyType && takeOnlyType === 'pow')
          ? await prisma.poW.findMany({
              where: {
                createdAt: {
                  ...(startDate ? { gte: startDate } : {}),
                  lte: endDate,
                },
                ...(userId ? { userId: userId as string } : {}),
              },
              skip: parseInt(skip as string, 10),
              take: parseInt(take as string, 10),
              orderBy:
                filter === 'popular'
                  ? [{ likeCount: 'desc' }, { createdAt: 'desc' }]
                  : { createdAt: 'desc' },
              include: poWInclude,
            })
          : [];
    }
    const powHighlighted =
      !pow.find((p) => p.id === highlightId) &&
      !!highlightId &&
      highlightType === 'pow'
        ? await prisma.poW.findUnique({
            where: {
              id: highlightId,
              ...(userId ? { userId: userId as string } : {}),
            },
            include: poWInclude,
          })
        : null;
    if (powHighlighted) {
      pow.unshift(powHighlighted);
    }

    logger.debug(`Fetching grants from ${startDate} to ${endDate}`);
    const grantApplicationInclude: Prisma.GrantApplicationInclude = {
      user: {
        select: {
          firstName: true,
          lastName: true,
          photo: true,
          username: true,
        },
      },
      grant: {
        select: {
          id: true,
          title: true,
          slug: true,
          token: true,
          sponsor: {
            select: {
              name: true,
              logo: true,
            },
          },
        },
      },
      Comments: commentsInclude,
      _count: {
        select: {
          Comments: commentsCountInclude,
        },
      },
    };
    const grantApplications =
      !takeOnlyType || (takeOnlyType && takeOnlyType === 'grant-application')
        ? await prisma.grantApplication.findMany({
            where: {
              OR: [
                {
                  applicationStatus: 'Approved',
                },
                {
                  applicationStatus: 'Completed',
                },
              ],
              decidedAt: {
                ...(startDate ? { gte: startDate } : {}),
                lte: endDate,
              },
              grant: {
                isPrivate: false,
              },
              ...(userId ? { userId: userId as string } : {}),
            },
            skip: parseInt(skip as string, 10),
            take: parseInt(take as string, 10),
            orderBy:
              filter === 'popular'
                ? [
                    // { approvedAmount: 'desc' },
                    { decidedAt: 'desc' },
                  ]
                : { decidedAt: 'desc' },
            include: grantApplicationInclude,
          })
        : [];

    const grantApplicationHighlighted =
      !grantApplications.find((ga) => ga.id === highlightId) &&
      !!highlightId &&
      highlightType === 'grant-application'
        ? await prisma.grantApplication.findUnique({
            where: {
              id: highlightId,
              ...(userId ? { userId: userId as string } : {}),
              OR: [
                {
                  applicationStatus: 'Approved',
                },
                {
                  applicationStatus: 'Completed',
                },
              ],
            },
            include: grantApplicationInclude,
          })
        : null;
    if (grantApplicationHighlighted) {
      grantApplications.unshift(grantApplicationHighlighted);
    }

    logger.info(
      `Fetched ${submissions.length} submissions, ${pow.length} PoWs and ${grantApplications} grant applications`,
    );

    const results = [
      ...submissions.map((sub) => ({
        id: sub.listing.isWinnersAnnounced ? sub.id : null,
        createdAt:
          sub.isWinner &&
          sub.listing.isWinnersAnnounced &&
          sub.listing.winnersAnnouncedAt
            ? sub.listing.winnersAnnouncedAt
            : sub.createdAt,
        link: sub.listing.isWinnersAnnounced ? sub.link : null,
        tweet: sub.listing.isWinnersAnnounced ? sub.tweet : null,
        otherInfo: sub.listing.isWinnersAnnounced ? sub.otherInfo : null,
        isWinner: sub.listing.isWinnersAnnounced ? sub.isWinner : null,
        winnerPosition: sub.listing.isWinnersAnnounced
          ? sub.winnerPosition
          : null,
        firstName: sub.user.firstName,
        lastName: sub.user.lastName,
        photo: sub.user.photo,
        username: sub.user.username,
        listingId: sub.listing.id,
        listingTitle: sub.listing.title,
        rewards: sub.listing.rewards,
        listingType: sub.listing.type,
        listingSlug: sub.listing.slug,
        isWinnersAnnounced: sub.listing.isWinnersAnnounced,
        token: sub.listing.token,
        //@ts-expect-error prisma ts error, this exists based on above include
        sponsorName: sub.listing.sponsor.name,
        //@ts-expect-error prisma ts error, this exists based on above include
        sponsorLogo: sub.listing.sponsor.logo,
        type: 'submission',
        like: sub.like,
        likeCount: sub.likeCount,
        ogImage: sub.ogImage,
        commentCount: sub._count.Comments,
        recentCommenters: sub.Comments,
      })),
      ...pow.map((pow) => ({
        id: pow.id,
        createdAt: pow.createdAt,
        description: pow.description,
        title: pow.title,
        firstName: pow.user.firstName,
        lastName: pow.user.lastName,
        photo: pow.user.photo,
        username: pow.user.username,
        type: 'pow',
        link: pow.link,
        like: pow.like,
        likeCount: pow.likeCount,
        ogImage: pow.ogImage,
        commentCount: pow._count.Comments,
        recentCommenters: pow.Comments,
      })),
      ...grantApplications.map((ga) => ({
        id: ga.id,
        createdAt: ga.decidedAt || ga.createdAt,
        firstName: ga.user.firstName,
        lastName: ga.user.lastName,
        photo: ga.user.photo,
        username: ga.user.username,
        listingId: ga.grant.id,
        listingTitle: ga.grant.title,
        listingSlug: ga.grant.slug,
        token: ga.grant.token,
        //@ts-expect-error prisma ts error, this exists based on above include
        sponsorName: ga.grant.sponsor.name,
        //@ts-expect-error prisma ts error, this exists based on above include
        sponsorLogo: ga.grant.sponsor.logo,
        type: 'grant-application',
        grantApplicationAmount: ga.approvedAmount,
        like: ga.like,
        likeCount: ga.likeCount,
        commentCount: ga._count.Comments,
        recentCommenters: ga.Comments,
      })),
    ];

    results.sort((a, b) => {
      if (a.id === highlightId) return -1;
      if (b.id === highlightId) return 1;
      if (filter === 'popular') {
        if (a.likeCount === b.likeCount) {
          return b.createdAt.getTime() - a.createdAt.getTime();
        }
        return b.likeCount - a.likeCount;
      } else {
        return b.createdAt.getTime() - a.createdAt.getTime();
      }
    });

    res.status(200).json(results);
  } catch (error: any) {
    logger.error(
      `Error occurred while fetching submissions and PoWs: ${safeStringify(error)}`,
    );
    res.status(500).json({ error: `Unable to fetch data: ${error.message}` });
  }
}
