import dayjs from 'dayjs';
import type { NextApiResponse } from 'next';
import Papa from 'papaparse';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { csvUpload, str2ab } from '@/utils/cloudinary';
import { safeStringify } from '@/utils/safeStringify';
import { getURL } from '@/utils/validUrl';

import { type NextApiRequestWithSponsor } from '@/features/auth/types';
import { checkGrantSponsorAuth } from '@/features/auth/utils/checkGrantSponsorAuth';
import { withSponsorAuth } from '@/features/auth/utils/withSponsorAuth';
import { type GrantApplicationWithUser } from '@/features/sponsor-dashboard/types';

function getSocialMediaLink(user: any): string {
  if (user.telegram) return user.telegram;
  if (user.twitter) return user.twitter;
  if (user.discord) return user.discord;
  return '';
}

async function handler(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  const userId = req.userId;
  const userSponsorId = req.userSponsorId;

  logger.debug(`Request query: ${safeStringify(req.query)}`);

  const params = req.query;
  const grantId = params.grantId as string;

  try {
    const { error, grant } = await checkGrantSponsorAuth(
      userSponsorId,
      grantId,
    );
    if (error) {
      return res.status(error.status).json({ error: error.message });
    }

    logger.debug(`Fetching applications for grant ID: ${grantId}`);
    const applications = await prisma.grantApplication.findMany({
      where: { grantId },
      include: { user: true },
      orderBy: [{ applicationStatus: 'asc' }, { createdAt: 'asc' }],
      take: 1000,
    });

    const grantQuestions = (grant.questions as { question: string }[]) || [];
    const questionSet = new Set(grantQuestions.map((q) => q.question));

    logger.debug('Transforming applications to JSON format for CSV export');
    const finalJson = applications.map(
      (application: GrantApplicationWithUser, i: number) => {
        const user = application.user;
        const applicationDate = dayjs(application?.createdAt).format(
          'DD MMM YYYY',
        );
        const customGrantAnswers: { [key: string]: string } = {};
        questionSet.forEach((question) => {
          const answer = (application as any).answers?.find(
            (a: any) => a.question === question,
          );
          customGrantAnswers[question] = answer ? answer.answer : '';
        });
        return {
          'Sr no': i + 1,
          Name: user.name ?? user.username ?? '',
          'Email ID': user.email,
          'Profile Link': `${getURL()}/t/${user.username}`,
          'User Wallet': user.publicKey,
          'User Social Link': getSocialMediaLink(user),
          'Application Date': applicationDate,
          'Project Title': application?.projectTitle,
          'One Liner Description': application?.projectOneLiner,
          'Project Details': application?.projectDetails,
          Deadline: application?.projectTimeline,
          'Proof of work': application?.proofOfWork,
          'Goals and Milestones': application?.proofOfWork,
          'Primary KPI': application?.kpi,
          ...customGrantAnswers,
          Ask: application.ask || '',
          'Approved Amount': application.approvedAmount,
          'Grant Decision': application.applicationStatus,
        };
      },
    );

    logger.debug('Converting JSON to CSV');
    const csv = Papa.unparse(finalJson);
    const fileName = `${grant.slug || grantId}-applications-${Date.now()}`;
    const file = str2ab(csv, fileName);

    logger.debug('Uploading CSV to Cloudinary');
    const cloudinaryDetails = await csvUpload(file, fileName, grantId);

    logger.info(`CSV export successful for grant ID: ${grantId}`);
    return res.status(200).json({
      url: cloudinaryDetails?.secure_url || cloudinaryDetails?.url,
    });
  } catch (error: any) {
    logger.error(
      `User ${userId} unable to download CSV: ${safeStringify(error)}`,
    );
    return res.status(400).json({
      error: error.message || error.toString(),
      message: `Error occurred while exporting applications of grant=${grantId}.`,
    });
  }
}

export default withSponsorAuth(handler);
