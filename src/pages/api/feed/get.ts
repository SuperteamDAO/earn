// activity feed
import { type NextApiRequest, type NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { type GrantApplicationInclude } from '@/prisma/models';
import { type CommentFindManyArgs } from '@/prisma/models/Comment';
import { type PoWGetPayload, type PoWInclude } from '@/prisma/models/PoW';
import { type SubmissionInclude } from '@/prisma/models/Submission';
import { getCloudinaryFetchUrl } from '@/utils/cloudinary';
import { dayjs } from '@/utils/dayjs';
import { safeStringify } from '@/utils/safeStringify';

import { getPrivyToken } from '@/features/auth/utils/getPrivyToken';
import { type FeedPostType } from '@/features/feed/types';

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

  const profileUserId = typeof userId === 'string' ? userId : null;

  let currentUserId: string | null = null;
  const privyDid = await getPrivyToken(req);
  if (privyDid) {
    const user = await prisma.user.findUnique({
      where: { privyDid },
      select: { id: true },
    });
    if (user) currentUserId = user.id;
  }

  const isOwnerProfile =
    typeof profileUserId === 'string' && currentUserId === profileUserId;

  const highlightType = req.query.highlightType as FeedPostType;
  let highlightId = req.query.highlightId as string | undefined;
  if (Number(skip) !== 0) highlightId = undefined;
  const takeOnlyType = req.query.takeOnlyType as FeedPostType | undefined;

  try {
    const profileUser = profileUserId
      ? await prisma.user.findUnique({
          where: { id: profileUserId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            photo: true,
            username: true,
            isAgent: true,
            agentProfile: {
              select: { id: true },
            },
          },
        })
      : null;

    const profileAgentId = profileUser?.agentProfile?.id;
    const shouldIncludeAgentSubmissions =
      !!profileUser?.isAgent && !!profileAgentId;

    const profileSubmissionFilter = profileUserId
      ? shouldIncludeAgentSubmissions
        ? {
            OR: [{ userId: profileUserId }, { agentId: profileAgentId }],
          }
        : { userId: profileUserId }
      : undefined;

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

    const commentsWhere: CommentFindManyArgs['where'] = {
      isActive: true,
      isArchived: false,
      replyToId: null,
    };

    const commentsInclude: CommentFindManyArgs = {
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
            isPro: true,
          },
        },
      },
    };

    const commentsCountInclude: CommentFindManyArgs = {
      where: commentsWhere,
    };

    logger.debug(`Fetching submissions from ${startDate} to ${endDate}`);
    const submissionInclude: SubmissionInclude = {
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
              slug: true,
            },
          },
          winnersAnnouncedAt: true,
          isPrivate: true,
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
              ...profileSubmissionFilter,
              listing: profileUserId ? {} : { isPrivate: false },
            },
            skip: parseInt(skip as string, 10),
            take: parseInt(take as string, 10),
            orderBy:
              highlightType === 'submission'
                ? [
                    { winnerPosition: 'asc' },
                    { likeCount: 'desc' },
                    { createdAt: 'desc' },
                  ]
                : filter === 'popular'
                  ? [
                      { likeCount: 'desc' },
                      { listing: { winnersAnnouncedAt: 'desc' } },
                      { createdAt: 'desc' },
                    ]
                  : [{ createdAt: 'desc' }],
            include: submissionInclude,
          })
        : [];

    const submissionHighlighted =
      !submissions.find((s) => s.id === highlightId) &&
      !!highlightId &&
      highlightType === 'submission'
        ? await prisma.submission.findFirst({
            where: {
              id: highlightId,
              ...profileSubmissionFilter,
            },
            include: submissionInclude,
          })
        : null;
    if (submissionHighlighted) {
      submissions.unshift(submissionHighlighted);
    }

    logger.debug('Fetching PoWs');
    const poWInclude: PoWInclude = {
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
    type UserWithoutKYC = {
      id: string;
      firstName: string | null;
      lastName: string | null;
      photo: string | null;
      username: string | null;
      isKYCVerified: boolean;
    };
    type PoWWithUserAndCommentsCount = Omit<
      PoWGetPayload<{
        include: typeof poWInclude;
      }>,
      'user'
    > & {
      user: UserWithoutKYC;
    };
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
    const grantApplicationInclude: GrantApplicationInclude = {
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
          isPrivate: true,
          sponsor: {
            select: {
              name: true,
              logo: true,
              slug: true,
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
              ...(userId ? { userId: userId as string } : {}),
              grant: userId ? {} : { isPrivate: false },
            },
            skip: parseInt(skip as string, 10),
            take: parseInt(take as string, 10),
            orderBy:
              filter === 'popular'
                ? [{ likeCount: 'desc' }, { decidedAt: 'desc' }]
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

    const subIds = submissions.map((s) => s.id);
    const powIds = pow.map((p) => p.id);
    const gaIds = grantApplications.map((ga) => ga.id);

    const [subLikes, poWLikes, gaLikes] = await Promise.all([
      subIds.length > 0
        ? prisma.likes.findMany({
            where: {
              targetType: 'SUBMISSION',
              targetId: { in: subIds },
            },
            select: { targetId: true, userId: true, createdAt: true },
          })
        : [],
      powIds.length > 0
        ? prisma.likes.findMany({
            where: {
              targetType: 'POW',
              targetId: { in: powIds },
            },
            select: { targetId: true, userId: true, createdAt: true },
          })
        : [],
      gaIds.length > 0
        ? prisma.likes.findMany({
            where: {
              targetType: 'GRANT_APPLICATION',
              targetId: { in: gaIds },
            },
            select: { targetId: true, userId: true, createdAt: true },
          })
        : [],
    ]);

    const likesByTargetId = (
      likes: { targetId: string; userId: string; createdAt: Date }[],
    ) => {
      const map = new Map<string, { id: string; date: number }[]>();
      for (const like of likes) {
        const arr = map.get(like.targetId) ?? [];
        arr.push({ id: like.userId, date: like.createdAt.getTime() });
        map.set(like.targetId, arr);
      }
      return map;
    };

    const subLikesMap = likesByTargetId(subLikes);
    const poWLikesMap = likesByTargetId(poWLikes);
    const gaLikesMap = likesByTargetId(gaLikes);

    const results = [
      ...submissions.map((sub) => ({
        ...(shouldIncludeAgentSubmissions &&
        profileAgentId &&
        sub.agentId === profileAgentId
          ? {
              firstName: profileUser?.firstName,
              lastName: profileUser?.lastName,
              photo: profileUser?.photo,
              username: profileUser?.username,
              userId: profileUser?.id,
            }
          : {
              firstName: sub.user.firstName,
              lastName: sub.user.lastName,
              photo: sub.user.photo,
              username: sub.user.username,
              userId: sub.userId,
            }),
        id:
          isOwnerProfile ||
          (sub.listing.isWinnersAnnounced && !sub.listing.isPrivate)
            ? sub.id
            : null,
        createdAt:
          sub.isWinner &&
          sub.listing.isWinnersAnnounced &&
          sub.listing.winnersAnnouncedAt
            ? sub.listing.winnersAnnouncedAt
            : sub.createdAt,
        link:
          isOwnerProfile ||
          (sub.listing.isWinnersAnnounced && !sub.listing.isPrivate)
            ? sub.link
            : null,
        tweet:
          isOwnerProfile ||
          (sub.listing.isWinnersAnnounced && !sub.listing.isPrivate)
            ? sub.tweet
            : null,
        otherInfo:
          isOwnerProfile ||
          (sub.listing.isWinnersAnnounced && !sub.listing.isPrivate)
            ? sub.otherInfo
            : null,
        isWinner: sub.listing.isWinnersAnnounced ? sub.isWinner : null,
        winnerPosition: sub.listing.isWinnersAnnounced
          ? sub.winnerPosition
          : null,
        listingId:
          isOwnerProfile || !sub.listing.isPrivate ? sub.listing.id : null,
        listingTitle:
          isOwnerProfile || !sub.listing.isPrivate ? sub.listing.title : null,
        rewards: sub.listing.rewards,
        listingType: sub.listing.type,
        listingSlug:
          isOwnerProfile || !sub.listing.isPrivate ? sub.listing.slug : null,
        isWinnersAnnounced: sub.listing.isWinnersAnnounced,
        token: sub.listing.token,
        sponsorName:
          isOwnerProfile || !sub.listing.isPrivate //@ts-expect-error prisma ts error, this exists based on above include
            ? sub.listing.sponsor.name
            : null,
        sponsorLogo:
          isOwnerProfile || !sub.listing.isPrivate //@ts-expect-error prisma ts error, this exists based on above include
            ? sub.listing.sponsor.logo
            : null,
        sponsorSlug:
          isOwnerProfile || !sub.listing.isPrivate //@ts-expect-error prisma ts error, this exists based on above include
            ? sub.listing.sponsor.slug
            : null,
        type: 'submission',
        like: subLikesMap.get(sub.id) || [],
        likeCount: sub.likeCount,
        ogImage: !sub.listing.isPrivate
          ? getCloudinaryFetchUrl(sub.ogImage)
          : null,
        commentCount: sub._count.Comments,
        recentCommenters: sub.Comments,
        isPrivate: isOwnerProfile ? false : sub.listing.isPrivate,
      })),
      ...pow.map((pow) => ({
        id: pow.id,
        createdAt: pow.createdAt,
        description: pow.description,
        title: pow.title,
        userId: pow.user.id,
        firstName: pow.user.firstName,
        lastName: pow.user.lastName,
        photo: pow.user.photo,
        username: pow.user.username,
        type: 'pow',
        link: pow.link,
        like: poWLikesMap.get(pow.id) || [],
        likeCount: pow.likeCount,
        ogImage: getCloudinaryFetchUrl(pow.ogImage),
        commentCount: pow._count.Comments,
        recentCommenters: pow.Comments,
      })),
      ...grantApplications.map((ga) => ({
        id: isOwnerProfile || !ga.grant.isPrivate ? ga.id : null,
        createdAt: ga.decidedAt || ga.createdAt,
        userId: ga.userId,
        firstName: ga.user.firstName,
        lastName: ga.user.lastName,
        photo: ga.user.photo,
        username: ga.user.username,
        listingId: isOwnerProfile || !ga.grant.isPrivate ? ga.grant.id : null,
        listingTitle:
          isOwnerProfile || !ga.grant.isPrivate ? ga.grant.title : null,
        listingSlug:
          isOwnerProfile || !ga.grant.isPrivate ? ga.grant.slug : null,
        token: ga.grant.token,
        sponsorName:
          isOwnerProfile || !ga.grant.isPrivate //@ts-expect-error prisma ts error, this exists based on above include
            ? ga.grant.sponsor.name
            : null,
        sponsorLogo:
          isOwnerProfile || !ga.grant.isPrivate //@ts-expect-error prisma ts error, this exists based on above include
            ? ga.grant.sponsor.logo
            : null,
        sponsorSlug:
          isOwnerProfile || !ga.grant.isPrivate //@ts-expect-error prisma ts error, this exists based on above include
            ? ga.grant.sponsor.slug
            : null,
        type: 'grant-application',
        grantApplicationAmount: ga.approvedAmount,
        like: gaLikesMap.get(ga.id) || [],
        likeCount: ga.likeCount,
        commentCount: ga._count.Comments,
        recentCommenters: ga.Comments,
        isPrivate: isOwnerProfile ? false : ga.grant.isPrivate,
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
