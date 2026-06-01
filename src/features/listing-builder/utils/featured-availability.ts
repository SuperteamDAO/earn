import type { BountiesWhereInput } from '@/prisma/models/Bounties';

export const buildFeaturedAvailabilityWhere = (): BountiesWhereInput => {
  const now = new Date();

  return {
    isFeatured: true,
    isPublished: true,
    isActive: true,
    isArchived: false,
    isPrivate: false,
    hackathonprize: false,
    isWinnersAnnounced: false,
    AND: [
      {
        OR: [{ deadline: null }, { deadline: { gte: now } }],
      },
      {
        language: { in: ['eng', 'sco'] },
        OR: [
          {
            compensationType: 'fixed',
            usdValue: { gt: 100 },
          },
          {
            compensationType: 'range',
            maxRewardAsk: { gt: 100 },
          },
          { compensationType: 'variable' },
        ],
      },
    ],
  };
};
