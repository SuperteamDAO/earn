import { type Prisma } from '@prisma/client';
import { type NextApiRequest, type NextApiResponse } from 'next';
import { z } from 'zod';

import { type FeedPostType, FeedPostTypeSchema } from '@/features/feed';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

const UUIDSchema = z.string().uuid();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  logger.debug(`Request query: ${safeStringify(req.query)}`);
  const type = req.query.type as FeedPostType;
  const id = req.query.id as string;

  if (typeof type !== 'string' || !FeedPostTypeSchema.safeParse(type).success) {
    logger.warn(`Invalid Feed Post Type ${id}`);
    res.status(404).send({
      error: 'Invalid type',
      message: 'Invalid type',
    });
    return;
  }
  if (typeof id !== 'string' || !UUIDSchema.safeParse(id).success) {
    logger.warn(`Invalid Feed Post ID ${id}`);
    res.status(404).send({
      error: 'Invalid ID',
      message: 'Invalid ID',
    });
    return;
  }

  try {
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
    let feedPost: any[] | null = null;
    switch (type) {
      case 'submission': {
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
        const submission = await prisma.submission.findUnique({
          where: {
            id,
          },
          include: submissionInclude,
        });
        if (submission) {
          const similarSubmissions = await prisma.submission.findMany({
            where: {
              id: {
                not: id,
              },
              listingId: submission?.listingId,
            },
            include: submissionInclude,
          });
          feedPost = [submission, ...similarSubmissions].map((sub) => ({
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
          }));
        }
        break;
      }
      case 'pow': {
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
        const pow: PoWWithUserAndCommentsCount | null =
          await prisma.poW.findUnique({
            where: {
              id,
            },
            include: poWInclude,
          });
        if (pow) {
          feedPost = [pow].map((pow) => ({
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
          }));
        }
        break;
      }
      case 'grant-application': {
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
        const grantApplication = await prisma.grantApplication.findUnique({
          where: {
            id,
          },
          include: grantApplicationInclude,
        });
        if (grantApplication) {
          feedPost = [grantApplication].map((ga) => ({
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
          }));
        }
        break;
      }
    }
    if (!feedPost) {
      logger.warn(`No Posts found for type ${type} with ID ${id}`);
      res.status(404).send({
        error: `No Posts found for type ${type} with ID ${id}`,
        message: `No Posts found for type ${type} with ID ${id}`,
      });
      return;
    }
    res.status(200).json(feedPost);
    return;
  } catch (error: any) {
    logger.error(
      `Error occurred while fetching Post of type${type} with ID ${id}: ${safeStringify(error)}`,
    );
    res.status(500).json({ error: `Unable to fetch data: ${error.message}` });
  }
}
