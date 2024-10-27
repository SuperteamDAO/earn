import {
  type GrantApplicationStatus,
  type SubmissionLabels,
} from '@prisma/client';
import type { NextApiResponse } from 'next';

import {
  checkGrantSponsorAuth,
  type NextApiRequestWithSponsor,
  withSponsorAuth,
} from '@/features/auth';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

async function handler(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  logger.debug(`Request body: ${safeStringify(req.body)}`);

  const params = req.query;
  const slug = params.slug as string;
  const skip = params.skip ? parseInt(params.skip as string, 10) : 0;
  const take = params.take ? parseInt(params.take as string, 10) : 20;
  const searchText = params.searchText as string;
  const filterLabel = params.filterLabel as
    | SubmissionLabels
    | GrantApplicationStatus
    | undefined;

  const textSearch = searchText
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
                user: { firstName: { contains: searchText.split(' ')[0] } },
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
    : {};

  const filterSearch: {
    applicationStatus?: GrantApplicationStatus;
    label?: SubmissionLabels;
  } = filterLabel
    ? {
        ...(filterLabel === 'Approved'
          ? {
              applicationStatus: 'Approved',
            }
          : {}),
        ...(filterLabel === 'Rejected'
          ? {
              applicationStatus: 'Rejected',
            }
          : {}),
        ...(filterLabel === 'Pending'
          ? {
              applicationStatus: 'Pending',
            }
          : {}),
        ...(filterLabel === 'Completed'
          ? {
              applicationStatus: 'Completed',
            }
          : {}),
        ...(filterLabel !== 'Rejected' &&
        filterLabel !== 'Approved' &&
        filterLabel !== 'Pending' &&
        filterLabel !== 'Completed'
          ? {
              label: filterLabel,
            }
          : {}),
      }
    : {};

  try {
    logger.info(
      `Fetching grant applications for slug: ${slug}, skip: ${skip}, take: ${take}, searchText: ${searchText}`,
    );

    const grant = await prisma.grants.findUnique({
      where: { slug },
    });

    if (!grant) {
      logger.warn(`Grant with slug=${slug} not found`);
      return res.status(404).json({
        message: `Grant with slug=${slug} not found.`,
      });
    }

    const { error } = await checkGrantSponsorAuth(req.userSponsorId, grant.id);
    if (error) {
      return res.status(error.status).json({ error: error.message });
    }

    const applications = await prisma.grantApplication.findMany({
      where: {
        grant: {
          slug,
          isActive: true,
          sponsorId: req.userSponsorId!,
        },
        ...textSearch,
        ...filterSearch,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            photo: true,
            publicKey: true,
            discord: true,
            username: true,
            twitter: true,
            telegram: true,
          },
        },
        grant: true,
      },
      orderBy: [{ applicationStatus: 'asc' }, { createdAt: 'desc' }],
      skip,
      take,
    });

    if (!applications || applications.length === 0) {
      logger.info(`No submissions found for slug: ${slug}`);
      // return res.status(404).json({
      //   message: `Submissions with slug=${slug} not found.`,
      // });
    }

    logger.info(
      `Successfully fetched ${applications.length} applications for slug: ${slug}`,
    );
    return res.status(200).json(applications);
  } catch (error: any) {
    logger.error(
      `Error fetching submissions with slug=${slug}: ${safeStringify(error)}`,
    );
    return res.status(400).json({
      error: error.message,
      message: `Error occurred while fetching submissions with slug=${slug}.`,
    });
  }
}

export default withSponsorAuth(handler);
