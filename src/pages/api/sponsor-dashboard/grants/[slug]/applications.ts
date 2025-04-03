import {
  type GrantApplicationStatus,
  Prisma,
  type SubmissionLabels,
} from '@prisma/client';
import type { NextApiResponse } from 'next';

import { type PrismaUserWithoutKYC } from '@/interface/user';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithSponsor } from '@/features/auth/types';
import { checkGrantSponsorAuth } from '@/features/auth/utils/checkGrantSponsorAuth';
import { withSponsorAuth } from '@/features/auth/utils/withSponsorAuth';
import { type GrantApplicationsReturn } from '@/features/sponsor-dashboard/queries/applications';
import { type GrantApplicationWithUser } from '@/features/sponsor-dashboard/types';

interface ApplicationIdWithEarnings {
  id: string;
  listingWinnings: number;
  grantWinnings: number;
}

async function handler(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  logger.debug(`Request body: ${safeStringify(req.body)}`);

  const params = req.query;
  const slug = params.slug as string;
  const skip = params.skip ? parseInt(params.skip as string, 10) : 0;
  const take = params.take ? parseInt(params.take as string, 10) : 20;
  const searchText = params.searchText as string | undefined;
  const filterLabel = params.filterLabel as
    | SubmissionLabels
    | GrantApplicationStatus
    | undefined;

  const textSearchConditions: Prisma.Sql[] = [];
  if (searchText) {
    const lowerSearchText = searchText.toLowerCase();
    const nameParts = searchText.split(' ').filter(Boolean);
    const lowerFirstNameSearch = nameParts[0]
      ? `${nameParts[0].toLowerCase()}%`
      : '%';
    const lowerLastNameSearch = nameParts[1]
      ? `${nameParts[1].toLowerCase()}%`
      : '%';
    const likePattern = `%${lowerSearchText}%`;

    textSearchConditions.push(Prisma.sql`(
      LOWER(User.firstName) LIKE ${likePattern} OR
      LOWER(User.email) LIKE ${likePattern} OR
      LOWER(User.username) LIKE ${likePattern} OR
      LOWER(User.twitter) LIKE ${likePattern} OR
      LOWER(User.discord) LIKE ${likePattern} OR
      LOWER(GrantApplication.projectTitle) LIKE ${likePattern} OR
      (LOWER(User.firstName) LIKE ${lowerFirstNameSearch} AND LOWER(User.lastName) LIKE ${lowerLastNameSearch})
    )`);
  }

  const filterSearchConditions: Prisma.Sql[] = [];
  if (filterLabel) {
    if (
      ['Approved', 'Rejected', 'Pending', 'Completed'].includes(filterLabel)
    ) {
      filterSearchConditions.push(
        Prisma.sql`GrantApplication.applicationStatus = ${filterLabel}`,
      );
    } else {
      filterSearchConditions.push(
        Prisma.sql`(GrantApplication.label = ${filterLabel} AND GrantApplication.applicationStatus = 'Pending')`,
      );
    }
  }

  try {
    logger.info(
      `Fetching grant applications for slug: ${slug}, skip: ${skip}, take: ${take}, searchText: ${searchText}, filter: ${filterLabel}`,
    );

    const grant = await prisma.grants.findUnique({
      where: { slug },
      select: { id: true, sponsorId: true, isActive: true },
    });

    if (!grant || !grant.isActive) {
      logger.warn(
        `Grant with slug=${slug} not found or is inactive. Grant exists: ${!!grant}`,
      );
      return res.status(404).json({
        message: `Grant with slug=${slug} not found or is inactive.`,
      });
    }

    const { error } = await checkGrantSponsorAuth(req.userSponsorId, grant.id);
    if (error) {
      return res.status(error.status).json({ error: error.message });
    }

    const baseWhereConditions: Prisma.Sql[] = [
      Prisma.sql`GrantApplication.grantId = ${grant.id}`,
      Prisma.sql`Grants.sponsorId = ${req.userSponsorId}`,
    ];

    if (textSearchConditions.length > 0) {
      baseWhereConditions.push(
        Prisma.sql`(${Prisma.join(textSearchConditions, ' OR ')})`,
      );
    }
    if (filterSearchConditions.length > 0) {
      baseWhereConditions.push(
        Prisma.sql`(${Prisma.join(filterSearchConditions, ' AND ')})`,
      );
    }
    const baseWhere = Prisma.join(baseWhereConditions, ' AND ');

    const countResult = await prisma.grantApplication.aggregate({
      _count: { id: true },
      where: {
        grant: { slug, isActive: true, sponsorId: req.userSponsorId! },
        ...(searchText
          ? {
              OR: [
                { user: { firstName: { contains: searchText } } },
                { user: { email: { contains: searchText } } },
                { user: { username: { contains: searchText } } },
                { user: { twitter: { contains: searchText } } },
                { user: { discord: { contains: searchText } } },
                { projectTitle: { contains: searchText } },
                {
                  AND: [
                    {
                      user: {
                        firstName: { contains: searchText.split(' ')[0] },
                      },
                    },
                    {
                      user: {
                        lastName: { contains: searchText.split(' ')[1] || '' },
                      },
                    },
                  ],
                },
              ],
            }
          : {}),
        ...(filterLabel
          ? {
              ...(filterLabel === 'Approved'
                ? { applicationStatus: 'Approved' }
                : {}),
              ...(filterLabel === 'Rejected'
                ? { applicationStatus: 'Rejected' }
                : {}),
              ...(filterLabel === 'Pending'
                ? {
                    applicationStatus: 'Pending',
                  }
                : {}),
              ...(filterLabel === 'Completed'
                ? { applicationStatus: 'Completed' }
                : {}),
              ...(filterLabel !== 'Rejected' &&
              filterLabel !== 'Approved' &&
              filterLabel !== 'Pending' &&
              filterLabel !== 'Completed'
                ? {
                    label: filterLabel as SubmissionLabels,
                    applicationStatus: 'Pending',
                  }
                : {}),
            }
          : {}),
      },
    });
    const totalCount = countResult._count.id;

    const orderByClause = Prisma.sql`
      ORDER BY
        CASE
          WHEN GrantApplication.applicationStatus = 'Pending' AND GrantApplication.label = 'Unreviewed' THEN 1
          WHEN GrantApplication.applicationStatus = 'Pending' AND GrantApplication.label = 'Pending' THEN 1
          WHEN GrantApplication.applicationStatus = 'Pending' AND GrantApplication.label = 'Shortlisted' THEN 2
          WHEN GrantApplication.applicationStatus = 'Pending' AND GrantApplication.label = 'High_Quality' THEN 2
          WHEN GrantApplication.applicationStatus = 'Pending' AND GrantApplication.label = 'Mid_Quality' THEN 3
          WHEN GrantApplication.applicationStatus = 'Pending' AND GrantApplication.label = 'Reviewed' THEN 3
          WHEN GrantApplication.applicationStatus = 'Pending' AND GrantApplication.label = 'Low_Quality' THEN 4
          WHEN GrantApplication.applicationStatus = 'Pending' AND GrantApplication.label = 'Spam' THEN 5
          WHEN GrantApplication.applicationStatus = 'Pending' THEN 10
          WHEN GrantApplication.applicationStatus = 'Approved' THEN 100
          WHEN GrantApplication.applicationStatus = 'Completed' THEN 110
          WHEN GrantApplication.applicationStatus = 'Rejected' THEN 120
          ELSE 999
        END ASC,
        GrantApplication.createdAt DESC
    `;

    const orderedIdsAndEarningsResult = await prisma.$queryRaw<
      ApplicationIdWithEarnings[]
    >`
      SELECT
          GrantApplication.id,
          (
              SELECT COALESCE(SUM(Sub.rewardInUSD), 0)
              FROM Submission Sub
              INNER JOIN Bounties Lis ON Sub.listingId = Lis.id
              WHERE Sub.userId = GrantApplication.userId
                AND Sub.isWinner = TRUE
                AND Lis.isWinnersAnnounced = TRUE
          ) AS listingWinnings,
          (
              SELECT COALESCE(SUM(GA_Sub.approvedAmountInUSD), 0)
              FROM GrantApplication GA_Sub
              WHERE GA_Sub.userId = GrantApplication.userId
                AND GA_Sub.applicationStatus IN ('Approved', 'Completed')
          ) AS grantWinnings
      FROM GrantApplication
      INNER JOIN Grants ON GrantApplication.grantId = Grants.id
      LEFT JOIN User ON GrantApplication.userId = User.id
      WHERE ${baseWhere}
      ${orderByClause}
      LIMIT ${take}
      OFFSET ${skip}
    `;

    const orderedIds = orderedIdsAndEarningsResult.map((r) => r.id);
    const orderMap = new Map(orderedIds.map((id, index) => [id, index]));
    const earningsMap = new Map(
      orderedIdsAndEarningsResult.map((r) => [
        r.id,
        (r.listingWinnings || 0) + (r.grantWinnings || 0),
      ]),
    );

    if (orderedIds.length === 0) {
      logger.info(
        `No applications found for slug: ${slug} with given criteria`,
      );
      return res.status(200).json({ data: [], count: totalCount });
    }

    const applicationsData = await prisma.grantApplication.findMany({
      where: {
        id: { in: orderedIds },
      },
      include: {
        user: {
          select: {
            id: true,
            publicKey: true,
            walletAddress: true,
            email: true,
            username: true,
            photo: true,
            firstName: true,
            lastName: true,
            createdAt: true,
            updatedAt: true,
            isVerified: true,
            role: true,
            isTalentFilled: true,
            interests: true,
            bio: true,
            twitter: true,
            discord: true,
            github: true,
            linkedin: true,
            website: true,
            telegram: true,
            community: true,
            experience: true,
            superteamLevel: true,
            location: true,
            cryptoExperience: true,
            workPrefernce: true,
            currentEmployer: true,
            notifications: true,
            private: true,
            skills: true,
            currentSponsorId: true,
            emailVerified: true,
            hackathonId: true,
            featureModalShown: true,
            surveysShown: true,
            stRecommended: true,
            acceptedTOS: true,
            stLead: true,
            isBlocked: true,
            privyDid: true,
            isKYCVerified: true,
          },
        },
        grant: true,
      },
    });

    const applications: GrantApplicationWithUser[] = applicationsData
      .map((application) => {
        const totalEarnings = earningsMap.get(application.id) ?? 0;
        const userWithoutKYC = application.user as PrismaUserWithoutKYC;

        return {
          ...application,
          user: userWithoutKYC,
          totalEarnings,
        };
      })
      .sort((a, b) => {
        const orderA = orderMap.get(a.id) ?? 9999;
        const orderB = orderMap.get(b.id) ?? 9999;
        return orderA - orderB;
      });

    logger.info(
      `Successfully fetched ${applications.length} applications for slug: ${slug}`,
    );

    const responseData: GrantApplicationsReturn = {
      data: applications,
      count: totalCount,
    };

    return res.status(200).json(responseData);
  } catch (error: any) {
    let errorMessage = `Error fetching submissions with slug=${slug}.`;
    if (error.code) {
      errorMessage += ` Code: ${error.code}`;
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError ||
      error instanceof Prisma.PrismaClientUnknownRequestError ||
      error instanceof Prisma.PrismaClientRustPanicError ||
      error instanceof Prisma.PrismaClientInitializationError ||
      error instanceof Prisma.PrismaClientValidationError
    ) {
      logger.error(
        `Prisma Error fetching submissions with slug=${slug}: ${safeStringify(error)}`,
        error.stack,
      );
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.meta) {
        errorMessage += ` Meta: ${safeStringify(error.meta)}`;
      }
    } else {
      logger.error(
        `Generic Error fetching submissions with slug=${slug}: ${safeStringify(error)}`,
        error.stack,
      );
    }

    return res.status(500).json({
      error: 'Internal Server Error',
      message: errorMessage,
      ...(process.env.NODE_ENV !== 'production'
        ? { details: safeStringify(error) }
        : {}),
    });
  }
}

export default withSponsorAuth(handler);
