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
        select: {
          approvedAmountInUSD: true,
        },
      },
    },
  });

  if (!grant) {
    return null;
  }

  const totalApplications =
    grant._count.GrantApplication + (grant.historicalApplications ?? 0);
  const approvedAmountTotal = grant.GrantApplication.reduce(
    (sum, application) => sum + (application.approvedAmountInUSD || 0),
    0,
  );
  const { GrantApplication, _count, ...grantData } = grant;

  return {
    ...grantData,
    approvedAmountTotal,
    createdAt: grantData.createdAt.toISOString(),
    updatedAt: grantData.updatedAt.toISOString(),
    totalApplications,
  };
};
