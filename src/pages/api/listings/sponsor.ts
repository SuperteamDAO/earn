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
  dreader: {
    title: 'dReader',
    description:
      'Explore latest artist and developer bounties for dReader on Superteam Earn. Get started now!',
    bgImage: '/assets/category_assets/bg/content.png',
  },
};

export default async function user(req: NextApiRequest, res: NextApiResponse) {
  const { sponsor } = req.body;
  const sponsorKey = sponsor.toLowerCase();

  if (!sponsorData[sponsorKey]) {
    return res.status(404).json({ message: 'Sponsor not found' });
  }

  const result: any = {
    bounties: [],
    sponsorInfo: sponsorData[sponsorKey],
  };

  try {
    const sponsorName = sponsorData[sponsorKey]?.title;
    const isPrivate = !!sponsorData[sponsorKey]?.private;

    const bounties = await prisma.bounties.findMany({
      where: {
        isPublished: true,
        isActive: true,
        isArchived: false,
        status: 'OPEN',
        isPrivate,
        sponsor: {
          name: sponsorName,
        },
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
        deadline: 'asc',
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
