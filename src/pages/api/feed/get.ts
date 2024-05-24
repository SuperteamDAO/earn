import { type PoW } from '@prisma/client';
import dayjs from 'dayjs';
import { type NextApiRequest, type NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  try {
    const { timePeriod, take = 15, skip = 0, isWinner, filter } = req.query;

    const winnerFilter =
      isWinner === 'true'
        ? {
            AND: [
              { isWinner: true },
              { listing: { isWinnersAnnounced: true } },
            ],
          }
        : {};

    let startDate: Date;
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
        startDate = dayjs().subtract(30, 'day').toDate();
        break;
    }

    const submissions = await prisma.submission.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        ...winnerFilter,
        listing: {
          isPrivate: false,
        },
      },
      skip: parseInt(skip as string, 10),
      take: parseInt(take as string, 10),
      orderBy:
        filter === 'popular'
          ? [{ likeCount: 'desc' }, { createdAt: 'desc' }]
          : { createdAt: 'desc' },
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

    let pow: (PoW & {
      user: {
        firstName: string | null;
        lastName: string | null;
        photo: string | null;
        username: string | null;
      };
    })[] = [];
    if (isWinner !== 'true') {
      pow = await prisma.poW.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        skip: parseInt(skip as string, 10),
        take: parseInt(take as string, 10),
        orderBy:
          filter === 'popular'
            ? [{ likeCount: 'desc' }, { createdAt: 'desc' }]
            : { createdAt: 'desc' },
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
    }

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
        sponsorName: sub.listing.sponsor.name,
        sponsorLogo: sub.listing.sponsor.logo,
        type: 'Submission',
        like: sub.like,
        likeCount: sub.likeCount,
        ogImage: sub.ogImage,
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
        type: 'PoW',
        link: pow.link,
        like: pow.like,
        likeCount: pow.likeCount,
        ogImage: pow.ogImage,
      })),
    ];

    results.sort((a, b) => {
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
    console.log(error);
    res.status(500).json({ error: `Unable to fetch data: ${error.message}` });
  }
}
