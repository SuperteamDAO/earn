export const exclusiveSponsorData: Record<
  string,
  {
    title: string;
    description: string;
    bgImage: string;
    showPrivates?: boolean;
  }
> = {
  'solana-gaming': {
    title: 'Solana Gaming',
    description:
      "Welcome to a special earnings page managed by Solana Gaming — use these opportunities to contribute to Solana's gaming ecosystem, and earn in global standards!",
    bgImage: '/assets/category_assets/bg/community.png',
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
  ns: {
    title: 'Network School',
    description:
      'Learn, burn and earn with techno-optimists over a 90-day programme on a private island near Singapore. More at: https://ns.com/.',
    bgImage: '/assets/category_assets/bg/content.png',
    showPrivates: true,
  },
};
