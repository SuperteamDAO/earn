import { prisma } from '@/prisma';

export const getGrantBySlug = async (slug: string) => {
  const grant = await prisma.grants.findFirst({
    where: { slug },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      shortDescription: true,
      token: true,
      minReward: true,
      maxReward: true,
      totalPaid: true,
      totalApproved: true,
      historicalApplications: true,
      link: true,
      sponsorId: true,
      pocId: true,
      isPublished: true,
      isFeatured: true,
      isActive: true,
      isArchived: true,
      createdAt: true,
      updatedAt: true,
      skills: true,
      logo: true,
      region: true,
      questions: true,
      pocSocials: true,
      status: true,
      avgResponseTime: true,
      isNative: true,
      airtableId: true,
      references: true,
      isPro: true,
      isST: true,
      sponsor: {
        select: {
          name: true,
          logo: true,
          slug: true,
          isVerified: true,
          entityName: true,
        },
      },
      _count: {
        select: {
          GrantApplication: {
            where: {
              OR: [
                {
                  applicationStatus: 'Approved',
                },
                {
                  applicationStatus: 'Completed',
                },
              ],
            },
          },
        },
      },
    },
  });

  if (!grant) {
    return null;
  }

  const totalApplications =
    grant._count.GrantApplication + (grant.historicalApplications ?? 0);

  return {
    ...grant,
    createdAt: grant.createdAt.toISOString(),
    updatedAt: grant.updatedAt.toISOString(),
    totalApplications,
  };
};
