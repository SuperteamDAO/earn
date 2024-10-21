import { type PoW } from '@prisma/client';
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
    let feedPost: any | null = null;
    switch (type) {
      case 'submission': {
        const submission = await prisma.submission.findUnique({
          where: {
            id,
          },
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
                  },
                },
                winnersAnnouncedAt: true,
              },
            },
          },
        });
        if (submission) {
          feedPost = {
            id: submission.listing.isWinnersAnnounced ? submission.id : null,
            createdAt:
              submission.isWinner &&
              submission.listing.isWinnersAnnounced &&
              submission.listing.winnersAnnouncedAt
                ? submission.listing.winnersAnnouncedAt
                : submission.createdAt,
            link: submission.listing.isWinnersAnnounced
              ? submission.link
              : null,
            tweet: submission.listing.isWinnersAnnounced
              ? submission.tweet
              : null,
            otherInfo: submission.listing.isWinnersAnnounced
              ? submission.otherInfo
              : null,
            isWinner: submission.listing.isWinnersAnnounced
              ? submission.isWinner
              : null,
            winnerPosition: submission.listing.isWinnersAnnounced
              ? submission.winnerPosition
              : null,
            firstName: submission.user.firstName,
            lastName: submission.user.lastName,
            photo: submission.user.photo,
            username: submission.user.username,
            listingId: submission.listing.id,
            listingTitle: submission.listing.title,
            rewards: submission.listing.rewards,
            listingType: submission.listing.type,
            listingSlug: submission.listing.slug,
            isWinnersAnnounced: submission.listing.isWinnersAnnounced,
            token: submission.listing.token,
            sponsorName: submission.listing.sponsor.name,
            sponsorLogo: submission.listing.sponsor.logo,
            type: 'Submission',
            like: submission.like,
            likeCount: submission.likeCount,
            ogImage: submission.ogImage,
          };
        }
        break;
      }
      case 'pow': {
        const pow:
          | (PoW & {
              user: {
                firstName: string | null;
                lastName: string | null;
                photo: string | null;
                username: string | null;
              };
            })
          | null = await prisma.poW.findUnique({
          where: {
            id,
          },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                photo: true,
                username: true,
              },
            },
          },
        });
        if (pow) {
          feedPost = {
            id: pow.id,
            createdAt: pow.createdAt,
            description: pow.description,
            title: pow.title,
            firstName: pow.user.firstName,
            lastName: pow.user.lastName,
            photo: pow.user.photo,
            username: pow.user.username,
            type: 'PoW',
            link: pow.link,
            like: pow.like,
            likeCount: pow.likeCount,
            ogImage: pow.ogImage,
          };
        }
        break;
      }
      case 'grant-application': {
        const grantApplication = await prisma.grantApplication.findUnique({
          where: {
            id,
          },
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
                sponsor: {
                  select: {
                    name: true,
                    logo: true,
                  },
                },
              },
            },
          },
        });
        if (grantApplication) {
          feedPost = {
            id: grantApplication.id,
            createdAt: grantApplication.decidedAt || grantApplication.createdAt,
            firstName: grantApplication.user.firstName,
            lastName: grantApplication.user.lastName,
            photo: grantApplication.user.photo,
            username: grantApplication.user.username,
            listingId: grantApplication.grant.id,
            listingTitle: grantApplication.grant.title,
            listingSlug: grantApplication.grant.slug,
            token: grantApplication.grant.token,
            sponsorName: grantApplication.grant.sponsor.name,
            sponsorLogo: grantApplication.grant.sponsor.logo,
            type: 'Grant',
            grantApplicationAmount: grantApplication.approvedAmount,
            like: grantApplication.like,
            likeCount: grantApplication.likeCount,
          };
        }
        break;
      }
    }
    if (!feedPost) {
      logger.warn(`No Post found for type ${type} with ID ${id}`);
      res.status(404).send({
        error: `No Post found for type ${type} with ID ${id}`,
        message: `No Post found for type ${type} with ID ${id}`,
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
