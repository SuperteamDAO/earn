import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithSponsor } from '@/features/auth/types';
import { checkGrantSponsorAuth } from '@/features/auth/utils/checkGrantSponsorAuth';
import { withSponsorAuth } from '@/features/auth/utils/withSponsorAuth';
import {
  sponsorGrantDetailsSelect,
  type SponsorGrantDetailsResponse,
} from '@/features/sponsor-dashboard/constants/sponsorGrantDetails';

async function handler(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  const userId = req.userId;

  logger.debug(`Request query: ${safeStringify(req.query)}`);

  const params = req.query;
  const slug = params.slug as string;

  try {
    logger.info(`Fetching grant details for slug: ${slug} for user: ${userId}`);

    const grant = await prisma.grants.findFirst({
      where: { slug },
      select: sponsorGrantDetailsSelect,
    });

    if (!grant) {
      logger.info(`Grant with slug=${slug} not found for user=${userId}`);
      return res.status(404).json({
        message: `Grant with slug=${slug} not found.`,
      });
    }

    const { error } = await checkGrantSponsorAuth(req.userSponsorId, grant.id);
    if (error) {
      const canAccessRequestedSponsor =
        error.sponsorId &&
        (req.role === 'GOD' ||
          !!(await prisma.userSponsors.findFirst({
            where: {
              userId: req.userId as string,
              sponsorId: error.sponsorId,
            },
            select: {
              sponsorId: true,
            },
          })));

      const response: {
        error: string;
        sponsorId?: string;
      } = {
        error: error.message,
      };
      if (canAccessRequestedSponsor && error.sponsorId) {
        response.sponsorId = error.sponsorId;
      }
      return res.status(error.status).json(response);
    }

    const [totalApplications, approvedAmount, grantTrancheCount] =
      await Promise.all([
        prisma.grantApplication.count({ where: { grantId: grant.id } }),
        prisma.grantApplication.aggregate({
          where: {
            grantId: grant.id,
            applicationStatus: { in: ['Approved', 'Completed'] },
          },
          _sum: { approvedAmountInUSD: true },
        }),
        prisma.grantTranche.count({ where: { grantId: grant.id } }),
      ]);

    const response: SponsorGrantDetailsResponse = {
      id: grant.id,
      title: grant.title,
      slug: grant.slug,
      token: grant.token ?? undefined,
      maxReward: grant.maxReward ?? undefined,
      historicalApplications: grant.historicalApplications,
      sponsorId: grant.sponsorId,
      isPublished: grant.isPublished,
      isActive: grant.isActive,
      isArchived: grant.isArchived,
      isPaused: grant.isPaused,
      questions: grant.questions as SponsorGrantDetailsResponse['questions'],
      region: grant.region,
      status: grant.status,
      references:
        (grant.references as unknown as SponsorGrantDetailsResponse['references']) ??
        [],
      airtableId: grant.airtableId ?? undefined,
      isNative: grant.isNative,
      ai: grant.ai as SponsorGrantDetailsResponse['ai'],
      emailSalutation: grant.emailSalutation,
      isST: grant.isST,
      sponsor: {
        id: grant.sponsor.id,
        name: grant.sponsor.name,
        slug: grant.sponsor.slug,
        logo: grant.sponsor.logo ?? '',
        entityName: grant.sponsor.entityName ?? undefined,
        isVerified: grant.sponsor.isVerified,
        chapter: grant.sponsor.chapter,
      },
      approvedAmountTotal: approvedAmount._sum.approvedAmountInUSD ?? 0,
      totalApplications,
      grantTrancheCount,
    };

    logger.info(`Grant details fetched successfully for slug=${slug}`);
    return res.status(200).json(response);
  } catch (error: any) {
    logger.error(
      `Error fetching grant with slug=${slug} for user=${userId}: ${safeStringify(error)}`,
    );
    return res.status(400).json({
      error: 'Internal Server Error',
      message: `Error occurred while fetching grant with slug=${slug}.`,
    });
  }
}

export default withSponsorAuth(handler);
