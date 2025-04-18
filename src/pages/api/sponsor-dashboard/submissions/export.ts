import type { NextApiResponse } from 'next';
import Papa from 'papaparse';

import { type SubmissionWithUser } from '@/interface/submission';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { getSubmissionUrl } from '@/utils/bounty-urls';
import { csvUpload, str2ab } from '@/utils/cloudinary';
import { safeStringify } from '@/utils/safeStringify';
import { getURL } from '@/utils/validUrl';

import { type NextApiRequestWithSponsor } from '@/features/auth/types';
import { withSponsorAuth } from '@/features/auth/utils/withSponsorAuth';
import { sponsorshipSubmissionStatus } from '@/features/listings/components/SubmissionsPage/SubmissionTable';

async function handler(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  const userId = req.userId;
  const submissionIds = req.body.submissionIds as string[] | undefined;
  const userSponsorId = req.userSponsorId;

  if (!submissionIds || submissionIds.length === 0) {
    return res.status(400).json({
      error: 'No submissions selected',
    });
  }

  const sponsor = await prisma.sponsors.findUnique({
    where: {
      id: userSponsorId,
    },
  });

  if (!sponsor) {
    return res.status(400).json({
      error: 'Sponsor not found',
    });
  }

  logger.debug(`Request query: ${safeStringify(req.query)}`);

  logger.debug(
    `Export request received for submissions - sponsorId: ${userSponsorId}`,
  );

  try {
    logger.debug(`Fetching submissions for sponsorId: ${userSponsorId}`);
    const submissions = await prisma.submission.findMany({
      where: {
        listing: {
          sponsorId: userSponsorId,
          isActive: true,
        },
        id: { in: submissionIds },
      },
      include: {
        listing: {
          include: {
            sponsor: true,
          },
        },
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    logger.debug('Transforming submissions to JSON format for CSV export');
    const finalJson = submissions.map((submissionInput) => {
      const submission = submissionInput as unknown as SubmissionWithUser;
      const user = submission.user;
      let ask = submission.ask;
      if (
        submission?.listing?.compensationType === 'fixed' &&
        submission.winnerPosition &&
        submission.isWinner
      ) {
        ask = submission?.listing?.rewards?.[submission.winnerPosition] ?? 0;
      }
      const isUsdBased = submission.listing?.token === 'Any';
      const token = isUsdBased ? submission.token : submission.listing?.token;

      const eligibilityQuestions = new Set<string>();
      submission.eligibilityAnswers?.forEach((answer: any) => {
        eligibilityQuestions.add(answer.question);
      });

      const eligibility = new Set<string>();
      eligibilityQuestions.forEach((question) => {
        const answer = (submission.eligibilityAnswers as Array<any>)?.find(
          (e: any) => e.question === question,
        );
        eligibility.add(answer ? answer.answer : '');
      });

      const status = sponsorshipSubmissionStatus(submission);
      let paymentStatus = '';
      switch (status) {
        case 'Paid':
          paymentStatus = 'Paid';
          break;
        case 'Approved':
          paymentStatus = 'Unpaid';
          break;
      }

      const txLink = submission.paymentDetails?.link
        ? submission.paymentDetails?.link
        : '';

      return {
        'Listing ID': submission.listing?.sequentialId,
        'Submission ID': submission.sequentialId,
        'Profile Link': `${getURL()}/t/${user.username}`,
        Name: `${user.firstName} ${user.lastName}`,
        'Submission Link': getSubmissionUrl(submission, submission.listing),
        'USD-based': isUsdBased ? 'True' : 'False',
        Ask: ask,
        Token: token,
        'Eligibility Questions':
          eligibilityQuestions.size > 0
            ? Array.from(eligibilityQuestions).join(', ')
            : '',
        'Eligibility Answers':
          eligibility.size > 0 ? Array.from(eligibility).join(', ') : '',
        Email: user.email,
        'User Wallet': user.publicKey,
        Status: status,
        'Payment Status': paymentStatus,
        'Created At': submission.createdAt,
        Tx: txLink,
      };
    });

    logger.debug('Converting JSON to CSV');
    const csv = Papa.unparse(finalJson);
    const fileName = `${sponsor.slug}-submissions-${Date.now()}`;
    const file = str2ab(csv, fileName);

    logger.debug('Uploading CSV to Cloudinary');
    const cloudinaryDetails = await csvUpload(file, fileName, sponsor.slug);

    logger.info(`CSV export successful for listing ID: ${sponsor.slug}`);
    return res.status(200).json({
      url: cloudinaryDetails?.secure_url || cloudinaryDetails?.url,
    });
  } catch (error: any) {
    logger.error(
      `User ${userId} unable to download CSV: ${safeStringify(error)}`,
    );
    return res.status(400).json({
      error: error.message || error.toString(),
      message: `Error occurred while exporting submissions of sponsor=${sponsor.slug}.`,
    });
  }
}

export default withSponsorAuth(handler);
