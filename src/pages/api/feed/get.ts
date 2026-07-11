import { type NextApiRequest, type NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { type CommentFindManyArgs } from '@/prisma/models/Comment';
import { getCloudinaryFetchUrl } from '@/utils/cloudinary';
import { dayjs } from '@/utils/dayjs';
import { safeStringify } from '@/utils/safeStringify';

import { getPrivyToken } from '@/features/auth/utils/getPrivyToken';
import { type FeedPostType } from '@/features/feed/types';
import {
  decodeCursor,
  encodeCursor,
  getFeedLikes,
  getFeedPage,
} from '@/services/feedService';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  logger.debug(`Request query: ${safeStringify(req.query)}`);
  const {
    timePeriod,
    take: takeParam = 15,
    cursor: cursorParam,
    isWinner,
    filter,
    userId,
  } = req.query;

  const profileUserId = typeof userId === 'string' ? userId : null;
  const take = Math.min(parseInt(takeParam as string, 10) || 15, 100);
  const cursor = typeof cursorParam === 'string' ? decodeCursor(cursorParam) : null;

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
  const highlightId = req.query.highlightId as string | undefined;
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

    // Step 1: Get globally sorted feed IDs via UNION query
    const feedItems = await getFeedPage(
      {
        startDate,
        endDate,
        isWinner: isWinner === 'true',
        filter: (filter as 'popular' | 'new') || undefined,
        profileUserId,
        profileAgentId: profileAgentId ?? undefined,
        shouldIncludeAgentSubmissions,
        takeOnlyType,
        highlightId,
        highlightType,
      },
      cursor,
      take,
    );

    if (feedItems.length === 0) {
      res.status(200).json({ data: [], nextCursor: null });
      return;
    }

    // Step 2: Separate IDs by type
    const subIds = feedItems.filter((i) => i.type === 'submission').map((i) => i.id);
    const powIds = feedItems.filter((i) => i.type === 'pow').map((i) => i.id);
    const gaIds = feedItems.filter((i) => i.type === 'grant-application').map((i) => i.id);

    // Step 3: Batch fetch records + likes
    const [submissions, powList, gaList, { subLikes, poWLikes, gaLikes }] =
      await Promise.all([
        subIds.length > 0
          ? prisma.submission.findMany({
              where: { id: { in: subIds } },
              include: {
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
              },
            })
          : ([] as any[]),
        powIds.length > 0
          ? prisma.poW.findMany({
              where: { id: { in: powIds } },
              include: {
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
              },
            })
          : ([] as any[]),
        gaIds.length > 0
          ? prisma.grantApplication.findMany({
              where: { id: { in: gaIds } },
              include: {
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
              },
            })
          : ([] as any[]),
        getFeedLikes(subIds, powIds, gaIds),
      ]);

    // Step 4: Build ID maps for ordering
    const subMap = new Map(submissions.map((s) => [s.id, s]));
    const powMap = new Map(powList.map((p) => [p.id, p]));
    const gaMap = new Map(gaList.map((g) => [g.id, g]));

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

    // Step 5: Build results in UNION order — no in-memory sort needed
    const results: Record<string, unknown>[] = [];

    for (const item of feedItems) {
      switch (item.type) {
        case 'submission': {
          const sub = subMap.get(item.id);
          if (!sub) continue;
          results.push({
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
              isOwnerProfile || !sub.listing.isPrivate
                ? sub.listing.title
                : null,
            rewards: sub.listing.rewards,
            listingType: sub.listing.type,
            listingSlug:
              isOwnerProfile || !sub.listing.isPrivate ? sub.listing.slug : null,
            isWinnersAnnounced: sub.listing.isWinnersAnnounced,
            token: sub.listing.token,
            sponsorName:
              isOwnerProfile || !sub.listing.isPrivate
                ? sub.listing.sponsor.name
                : null,
            sponsorLogo:
              isOwnerProfile || !sub.listing.isPrivate
                ? sub.listing.sponsor.logo
                : null,
            sponsorSlug:
              isOwnerProfile || !sub.listing.isPrivate
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
          });
          break;
        }
        case 'pow': {
          const p = powMap.get(item.id);
          if (!p) continue;
          results.push({
            id: p.id,
            createdAt: p.createdAt,
            description: p.description,
            title: p.title,
            userId: p.user.id,
            firstName: p.user.firstName,
            lastName: p.user.lastName,
            photo: p.user.photo,
            username: p.user.username,
            type: 'pow',
            link: p.link,
            like: poWLikesMap.get(p.id) || [],
            likeCount: p.likeCount,
            ogImage: getCloudinaryFetchUrl(p.ogImage),
            commentCount: p._count.Comments,
            recentCommenters: p.Comments,
          });
          break;
        }
        case 'grant-application': {
          const ga = gaMap.get(item.id);
          if (!ga) continue;
          results.push({
            id: isOwnerProfile || !ga.grant.isPrivate ? ga.id : null,
            createdAt: ga.decidedAt || ga.createdAt,
            userId: ga.userId,
            firstName: ga.user.firstName,
            lastName: ga.user.lastName,
            photo: ga.user.photo,
            username: ga.user.username,
            listingId:
              isOwnerProfile || !ga.grant.isPrivate ? ga.grant.id : null,
            listingTitle:
              isOwnerProfile || !ga.grant.isPrivate ? ga.grant.title : null,
            listingSlug:
              isOwnerProfile || !ga.grant.isPrivate ? ga.grant.slug : null,
            token: ga.grant.token,
            sponsorName:
              isOwnerProfile || !ga.grant.isPrivate
                ? ga.grant.sponsor.name
                : null,
            sponsorLogo:
              isOwnerProfile || !ga.grant.isPrivate
                ? ga.grant.sponsor.logo
                : null,
            sponsorSlug:
              isOwnerProfile || !ga.grant.isPrivate
                ? ga.grant.sponsor.slug
                : null,
            type: 'grant-application',
            grantApplicationAmount: ga.approvedAmount,
            like: gaLikesMap.get(ga.id) || [],
            likeCount: ga.likeCount,
            commentCount: ga._count.Comments,
            recentCommenters: ga.Comments,
            isPrivate: isOwnerProfile ? false : ga.grant.isPrivate,
          });
          break;
        }
      }
    }

    // Step 6: Build cursor for next page
    const lastItem = feedItems[feedItems.length - 1]!;
    const nextCursor = results.length === take
      ? encodeCursor(
          filter === 'popular'
            ? {
                likeCount: lastItem.likeCount,
                createdAt: lastItem.createdAt.toISOString(),
                id: lastItem.id,
              }
            : {
                sortDate: lastItem.sortDate.toISOString(),
                id: lastItem.id,
              },
        )
      : null;

    res.status(200).json({ data: results, nextCursor });
  } catch (error: any) {
    logger.error(
      `Error occurred while fetching submissions and PoWs: ${safeStringify(error)}`,
    );
    res.status(500).json({ error: `Unable to fetch data: ${error.message}` });
  }
}
