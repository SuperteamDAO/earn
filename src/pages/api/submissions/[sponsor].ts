import { type Prisma } from '@prisma/client';
import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithPotentialSponsor } from '@/features/auth/types';
import { withPotentialSponsorAuth } from '@/features/auth/utils/withPotentialSponsorAuth';

async function handler(
  req: NextApiRequestWithPotentialSponsor,
  res: NextApiResponse,
) {
  const params = req.query;
  const sponsorSlug = params.sponsor as string;
  const status = params.status as string;
  const customQuestion = params.customQuestion;
  const customAnswer = params.customAnswer;
  const firstName = params.firstName;
  const lastName = params.lastName;
  const sequentialId = params.sequentialId;

  const isGod = req.authorized && req.role === 'GOD';
  const validation = isGod ? {} : { isActive: true, isArchived: false };

  logger.debug(`Request query: ${safeStringify(req.query)}`);
  let statusFilter: Prisma.SubmissionWhereInput;
  switch (status?.toLowerCase()) {
    case 'paid':
      statusFilter = { isPaid: true };
      break;
    case 'approved':
      statusFilter = { status: 'Approved' };
      break;
    case 'pending':
      statusFilter = { status: 'Pending' };
      break;
    case 'rejected':
      statusFilter = { status: 'Rejected' };
      break;
    default:
      statusFilter = {};
      break;
  }

  try {
    let questionSearchIds: string[] | undefined;

    if (customQuestion && customAnswer) {
      const result = await prisma.$queryRaw<
        { id: string; question: string; answer: string }[]
      >`
        SELECT DISTINCT s.id
        FROM Submission s
        JOIN Bounties b ON s.listingId = b.id
        JOIN Sponsors sp ON b.sponsorId = sp.id
        CROSS JOIN JSON_TABLE(
          s.eligibilityAnswers,
          '$[*]' COLUMNS (
            question VARCHAR(255) PATH '$.question',
            answer VARCHAR(255) PATH '$.answer'
          )
        ) as jt
        WHERE sp.slug = ${sponsorSlug}
        AND jt.question LIKE CONCAT('%', ${customQuestion}, '%')
        AND jt.answer LIKE CONCAT('%', ${customAnswer}, '%')
      `;
      questionSearchIds = result.map((r) => r.id);
    }

    logger.debug(
      `Fetching submissions with sponsor slug: ${sponsorSlug}, isGod: ${isGod}`,
    );
    const result = await prisma.submission.findMany({
      where: {
        listing: {
          sponsor: {
            slug: sponsorSlug,
          },
          isPrivate: isGod ? undefined : false,
          ...validation,
        },
        user: {
          ...(lastName && { lastName: { contains: lastName as string } }),
          ...(firstName && { firstName: { contains: firstName as string } }),
        },
        ...(sequentialId && {
          sequentialId: { equals: parseInt(sequentialId as string) },
        }),
        ...validation,
        ...statusFilter,
        ...(questionSearchIds ? { id: { in: questionSearchIds } } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            publicKey: true,
            photo: true,
            username: true,
            private: true,
          },
        },
        listing: {
          select: {
            eligibility: true,
            sequentialId: true,
          },
        },
      },
      orderBy: {
        sequentialId: 'desc',
      },
    });

    if (!result) {
      logger.warn(`No submissions found with sponsor slug: ${sponsorSlug}`);
      return res.status(404).json({
        message: `No submissions found with sponsor slug=${sponsorSlug}.`,
      });
    }

    return res.status(200).json(
      result.map((r) => ({
        ...r,
        notes: undefined,
        user: {
          ...r.user,
          firstName: r.user.private ? undefined : r.user.firstName,
          lastName: r.user.private ? undefined : r.user.lastName,
        },
        listing: {
          ...r.listing,
        },
      })),
    );
  } catch (error: any) {
    logger.error(
      `Error occurred while fetching submissions with sponsor slug=${sponsorSlug}: ${safeStringify(error)}`,
    );
    return res.status(400).json({
      error: error.message,
      message: `Error occurred while fetching submissions with sponsor slug=${sponsorSlug}.`,
    });
  }
}

export default withPotentialSponsorAuth(handler);
