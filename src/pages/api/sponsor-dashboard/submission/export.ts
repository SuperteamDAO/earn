import type { NextApiResponse } from 'next';
import Papa from 'papaparse';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { csvUpload, str2ab } from '@/utils/cloudinary';
import { safeStringify } from '@/utils/safeStringify';

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  const userId = req.userId;

  logger.debug(`Request query: ${safeStringify(req.query)}`);

  const params = req.query;
  const listingId = params.listingId as string;

  try {
    logger.debug(`Fetching user with ID: ${userId}`);
    const user = await prisma.user.findUnique({
      where: {
        id: userId as string,
      },
    });

    logger.debug(`Fetching bounty with ID: ${listingId}`);
    const bounty = await prisma.bounties.findFirst({
      where: {
        id: listingId,
        isActive: true,
        isArchived: false,
      },
      select: {
        id: true,
        slug: true,
        type: true,
        sponsorId: true,
        hackathonId: true,
      },
    });

    if (
      user?.currentSponsorId !== bounty?.sponsorId &&
      user?.hackathonId !== bounty?.hackathonId
    ) {
      logger.warn(
        `User ${userId} is not authorized to export submissions for listing ${listingId}`,
      );
      return res.status(401).json({ error: 'Unauthorized' });
    }

    logger.debug(`Fetching submissions for listing ID: ${listingId}`);
    const submissions = await prisma.submission.findMany({
      where: {
        listingId,
        isActive: true,
        isArchived: false,
      },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: 1000,
    });

    const eligibilityQuestions = new Set<string>();
    submissions.forEach((submission: any) => {
      submission.eligibilityAnswers?.forEach((answer: any) => {
        eligibilityQuestions.add(answer.question);
      });
    });

    logger.debug('Transforming submissions to JSON format for CSV export');
    const finalJson = submissions.map((submission: any, i: number) => {
      const user = submission.user;
      const eligibility: any = {};
      eligibilityQuestions.forEach((question) => {
        const answer = submission.eligibilityAnswers?.find(
          (e: any) => e.question === question,
        );
        eligibility[question] = answer ? answer.answer : '';
      });
      return {
        'Sr no': i + 1,
        'Profile Link': `https://earn.superteam.fun/t/${user.username}`,
        Name: `${user.firstName} ${user.lastName}`,
        'Submission Link': submission.link || '',
        ...eligibility,
        Ask: submission.ask || '',
        'Tweet Link': submission.tweet || '',
        'Email ID': user.email,
        'User Twitter': user.twitter || '',
        'User Wallet': user.publicKey,
        Label: submission.label,
        'Winner Position': submission.isWinner ? submission.winnerPosition : '',
      };
    });

    logger.debug('Converting JSON to CSV');
    const csv = Papa.unparse(finalJson);
    const fileName = `${bounty?.slug || listingId}-submissions-${Date.now()}`;
    const file = str2ab(csv, fileName);

    logger.debug('Uploading CSV to Cloudinary');
    const cloudinaryDetails = await csvUpload(file, fileName, listingId);

    logger.info(`CSV export successful for listing ID: ${listingId}`);
    return res.status(200).json({
      url: cloudinaryDetails?.secure_url || cloudinaryDetails?.url,
    });
  } catch (error: any) {
    logger.error(
      `User ${userId} unable to download CSV: ${safeStringify(error)}`,
    );
    return res.status(400).json({
      error: error.message || error.toString(),
      message: `Error occurred while exporting submissions of listing=${listingId}.`,
    });
  }
}

export default withAuth(handler);
