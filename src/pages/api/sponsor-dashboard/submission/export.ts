import type { NextApiResponse } from 'next';
import Papa from 'papaparse';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { csvUpload, str2ab } from '@/utils/cloudinary';

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  const userId = req.userId;

  const user = await prisma.user.findUnique({
    where: {
      id: userId as string,
    },
  });

  const params = req.query;

  const listingId = params.listingId as string;
  try {
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
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await prisma.submission.findMany({
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
    result.forEach((submission: any) => {
      submission.eligibilityAnswers?.forEach((answer: any) => {
        eligibilityQuestions.add(answer.question);
      });
    });

    const finalJson = result?.map((item: any, i) => {
      const user = item.user;
      const eligibility: any = {};
      eligibilityQuestions.forEach((question) => {
        const answer = item.eligibilityAnswers?.find(
          (e: any) => e.question === question,
        );
        eligibility[question] = answer ? answer.answer : '';
      });
      return {
        'Sr no': i + 1,
        'Profile Link': `https://earn.superteam.fun/t/${user.username}`,
        Name: `${user.firstName} ${user.lastName}`,
        'Submission Link': item.link || '',
        ...eligibility,
        Ask: item.ask && item.ask,
        'Tweet Link': item.tweet || '',
        'Email ID': user.email,
        'User Twitter': user.twitter || '',
        'User Wallet': user.publicKey,
        Label: item.label,
        'Winner Position': item.isWinner ? item.winnerPosition : '',
      };
    });

    const csv = Papa.unparse(finalJson);
    const fileName = `${bounty?.slug || listingId}-submissions-${Date.now()}`;
    const file = str2ab(csv, fileName);
    const cloudinaryDetails = await csvUpload(file, fileName, listingId);
    res.status(200).json({
      url: cloudinaryDetails?.secure_url || cloudinaryDetails?.url,
    });
  } catch (error: any) {
    logger.error(`User ${userId} unable to download csv`, error.message);
    return res.status(400).json({
      error: error.message || error.toString(),
      message: `Error occurred while exporting submissions of listing=${listingId}.`,
    });
  }
}

export default withAuth(handler);
