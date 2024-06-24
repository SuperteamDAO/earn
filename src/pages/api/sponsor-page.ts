import { type NextApiRequest, type NextApiResponse } from 'next';

import { prisma } from '@/prisma';

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
  dReader: {
    title: 'dReader',
    description:
      'Explore the latest bounties for dReader on Superteam Earn. Get started now!',
    bgImage: '/assets/category_assets/bg/content.png',
  },
};

export default async function user(req: NextApiRequest, res: NextApiResponse) {
  const { sponsor } = req.body;

  if (!sponsorData[sponsor]) {
    return res.status(404).json({ message: 'Sponsor not found' });
  }

  const result: any = {
    bounties: [],
    sponsorInfo: sponsorData[sponsor],
  };

  try {
    const sponsorName = sponsorData[sponsor]?.title;
    const isPrivate = sponsorData[sponsor]?.private;

    const bounties = await prisma.bounties.findMany({
      where: {
        isPublished: true,
        isActive: true,
        isArchived: false,
        status: 'OPEN',
        sponsor: {
          name: sponsorName,
        },
        ...(isPrivate !== undefined && { isPrivate: isPrivate }),
      },
      include: {
        sponsor: {
          select: {
            name: true,
            slug: true,
            logo: true,
          },
        },
      },
      orderBy: {
        deadline: 'desc',
      },
    });

    result.bounties = bounties;

    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res.status(400).json({
      error,
      message: 'Error occurred while fetching listings',
    });
  }
}
