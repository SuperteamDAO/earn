import { type Prisma } from '@prisma/client';
import cors from 'cors';
import type { NextApiRequest, NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

const corsMiddleware = cors({
  origin: ['http://localhost:3000', '*.near.page'],
  methods: ['GET'],
});

async function runMiddleware(req: NextApiRequest, res: NextApiResponse) {
  return new Promise((resolve, reject) => {
    corsMiddleware(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  await runMiddleware(req, res);

  const params = req.query;
  const sponsorSlug = params.sponsor as string;
  const status = params.status as string;
  const customQuestion = params.customQuestion;
  const customAnswer = params.customAnswer;
  const name = params.name;
  const sequentialId = params.sequentialId;

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

    logger.debug(`Fetching submissions with sponsor slug: ${sponsorSlug}`);
    const result = await prisma.submission.findMany({
      where: {
        listing: {
          sponsor: {
            slug: sponsorSlug,
          },
          isPrivate: false,
          isActive: true,
          isArchived: false,
        },
        isActive: true,
        isArchived: false,
        user: {
          ...(name && { name: { contains: name as string } }),
        },
        ...(sequentialId && {
          sequentialId: { equals: parseInt(sequentialId as string) },
        }),
        ...statusFilter,
        ...(questionSearchIds ? { id: { in: questionSearchIds } } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
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
          name: r.user.private ? undefined : r.user.name,
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
