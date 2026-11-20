import { type NextApiRequest, type NextApiResponse } from 'next';
import { z } from 'zod';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { type CommentFindManyArgs } from '@/prisma/models/Comment';
import { type GrantApplicationInclude } from '@/prisma/models/GrantApplication';
import { type PoWInclude } from '@/prisma/models/PoW';
import { type SubmissionInclude } from '@/prisma/models/Submission';
import {
  decodeCursor,
  encodeCursor,
  type FeedCursor,
  type FeedType,
  FeedTypeSchema,
  getFeedPage,
} from '@/services/feedService';
import { parseBoundedIntegerParam } from '@/utils/apiPagination';
import { getCloudinaryFetchUrl } from '@/utils/cloudinary';
import { dayjs } from '@/utils/dayjs';
import { safeStringify } from '@/utils/safeStringify';

import { getPrivyToken } from '@/features/auth/utils/getPrivyToken';

// Strict schema to validate request query parameters and reject repeated array parameters
const FeedQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  highlightId: z.string().uuid().optional(),
  highlightType: FeedTypeSchema.optional(),
  takeOnlyType: FeedTypeSchema.optional(),
  filter: z.enum(['popular', 'new']).optional(),
  timePeriod: z.string().optional(),
  isWinner: z.string().optional(),
  userId: z.string().optional(),
  take: z.union([z.string(), z.number()]).optional(),
  skip: z.union([z.string(), z.number()]).optional(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  logger.debug(`Request query: ${safeStringify(req.query)}`);

  // Validate query parameter shapes: rejects arrays and malformed scalars with 400
  const parsedQuery = FeedQuerySchema.safeParse(req.query);
  if (!parsedQuery.success) {
    return res.status(400).json({
      error: 'Invalid query parameters',
      details: parsedQuery.error.format(),
    });
  }

  const {
    timePeriod,
    isWinner,
    filter,
    userId,
    highlightId,
    highlightType,
    takeOnlyType,
  } = parsedQuery.data;

  const takeResult = parseBoundedIntegerParam(req.query.take, {
    defaultValue: 15,
    maxValue: 30,
    name: 'take',
  });
  const skipResult = parseBoundedIntegerParam(req.query.skip, {
    defaultValue: 0,
    maxValue: 1000,
    name: 'skip',
  });

  if (!takeResult.ok) {
    return res.status(400).json({ error: takeResult.error });
  }
  if (!skipResult.ok) {
    return res.status(400).json({ error: skipResult.error });
  }

  const take = takeResult.value;
  const skip = skipResult.value;

  let cursor: FeedCursor | null = null;
  if (parsedQuery.data.cursor) {
    cursor = decodeCursor(parsedQuery.data.cursor);
    if (!cursor) {
      return res.status(400).json({ error: 'Invalid pagination cursor' });
    }
    // Reject popular feed cursors that omit likeCount (0 is valid, omitted is not)
    if (filter === 'popular' && cursor.likeCount === undefined) {
      return res.status(400).json({
        error: 'Popular feed cursor must include likeCount',
      });
    }
  }

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

    // Step 1: Get globally sorted feed IDs via keyset-bounded database query
    const { items: feedItems, hasMore } = await getFeedPage(
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
      skip,
    );

    if (feedItems.length === 0) {
      res.status(200).json({ data: [], nextCursor: null });
      return;
    }

    // Step 2: Separate IDs by type
    const subIds = feedItems
      .filter((i) => i.type === 'submission')
      .map((i) => i.id);
    const powIds = feedItems.filter((i) => i.type === 'pow').map((i) => i.id);
    const gaIds = feedItems
      .filter((i) => i.type === 'grant-application')
      .map((i) => i.id);

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

    // Step 3: Batch fetch records in parallel for only the requested IDs
    const [submissions, powList, gaList] = await Promise.all([
      subIds.length > 0
        ? prisma.submission.findMany({
            where: { id: { in: subIds } },
            include: submissionInclude,
          })
        : [],
      powIds.length > 0
        ? prisma.poW.findMany({
            where: { id: { in: powIds } },
            include: poWInclude,
          })
        : [],
      gaIds.length > 0
        ? prisma.grantApplication.findMany({
            where: { id: { in: gaIds } },
            include: grantApplicationInclude,
          })
        : [],
    ]);

    // Step 4: Map records by ID
    const subMap = new Map(submissions.map((s) => [s.id, s]));
    const powMap = new Map(powList.map((p) => [p.id, p]));
    const gaMap = new Map(gaList.map((g) => [g.id, g]));

    // Step 5: Build results in exact database order
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
              isOwnerProfile || !sub.listing.isPrivate
                ? sub.listing.slug
                : null,
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
            like: sub.like,
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
            like: p.like,
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
            like: ga.like,
            likeCount: ga.likeCount,
            commentCount: ga._count.Comments,
            recentCommenters: ga.Comments,
            isPrivate: isOwnerProfile ? false : ga.grant.isPrivate,
          });
          break;
        }
      }
    }

    // Step 6: Determine nextCursor
    // nextCursor is only generated if hasMore is true (an extra row was returned by the database),
    // and is built from the last returned row, completely eliminating empty final pagination requests.
    const effectiveHighlightId = cursor?.highlightId || highlightId;
    const effectiveHighlightType = cursor?.highlightType || (highlightType as FeedType | undefined);
    const lastItem = feedItems[feedItems.length - 1];

    const nextCursor =
      hasMore && lastItem
        ? encodeCursor({
            id: lastItem.id,
            type: lastItem.type,
            sortDate:
              lastItem.sortDate instanceof Date
                ? lastItem.sortDate.toISOString()
                : new Date(lastItem.sortDate).toISOString(),
            ...(filter === 'popular' ? { likeCount: lastItem.likeCount } : {}),
            ...(effectiveHighlightId && effectiveHighlightType
              ? {
                  highlightId: effectiveHighlightId,
                  highlightType: effectiveHighlightType,
                }
              : {}),
          })
        : null;

    res.status(200).json({ data: results, nextCursor });
  } catch (error: any) {
    logger.error(
      `Error occurred while fetching feed: ${safeStringify(error)}`,
    );
    // Generic safe 500 response that hides internal database/system details
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Unable to fetch feed data at this time',
    });
  }
}
