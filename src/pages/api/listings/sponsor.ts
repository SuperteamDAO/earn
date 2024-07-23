import { type NextApiRequest, type NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

const sponsorData: Record<
  string,
  {
    title: string;
    description: string;
    bgImage: string;
    private?: boolean;
  }
> = {
  'solana-gaming': {
    title: 'Solana Gaming',
    description:
      "Welcome to a special earnings page managed by Solana Gaming — use these opportunities to contribute to Solana's gaming ecosystem, and earn in global standards!",
    bgImage: '/assets/category_assets/bg/community.png',
    private: true,
  },
  pyth: {
    title: 'Pyth Network',
    description:
      'Explore the latest Research and Developer bounties for the Pyth Network ecosystem on Superteam Earn. Get started now!',
    bgImage: '/assets/category_assets/bg/content.png',
  },
  dreader: {
    title: 'dReader',
    description:
      'Explore latest artist and developer bounties for dReader on Superteam Earn. Get started now!',
    bgImage: '/assets/category_assets/bg/content.png',
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { sponsor } = req.body;

  logger.debug(`Request body: ${safeStringify(req.body)}`);

  if (!sponsor) {
    logger.warn('Sponsor is required');
    return res.status(400).json({ message: 'Sponsor is required' });
  }

  const sponsorKey = sponsor.toLowerCase();

  if (!sponsorData[sponsorKey]) {
    logger.warn(`Sponsor not found: ${sponsorKey}`);
    return res.status(404).json({ message: 'Sponsor not found' });
  }

  const sponsorInfo = sponsorData[sponsorKey];

  try {
    logger.debug(`Fetching bounties for sponsor: ${sponsorInfo?.title}`);
    const bounties = await prisma.bounties.findMany({
      where: {
        isPublished: true,
        isActive: true,
        isArchived: false,
        status: 'OPEN',
        isPrivate: !!sponsorInfo!.private,
        sponsor: {
          name: sponsorInfo!.title,
        },
      },
      include: {
        sponsor: {
          select: {
            name: true,
            slug: true,
            logo: true,
            isVerified: true,
          },
        },
      },
      orderBy: {
        deadline: 'asc',
      },
    });

    const result = {
      bounties,
      sponsorInfo,
    };

    logger.info(
      `Successfully fetched listings for sponsor: ${sponsorInfo?.title}`,
    );
    res.status(200).json(result);
  } catch (error: any) {
    logger.error(
      `Error fetching listings for sponsor=${sponsorKey}: ${safeStringify(error)}`,
    );
    res.status(500).json({
      error: 'Internal server error',
      message: 'Error occurred while fetching listings',
    });
  }
}
