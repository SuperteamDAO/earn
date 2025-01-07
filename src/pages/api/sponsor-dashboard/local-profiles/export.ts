import type { NextApiResponse } from 'next';
import Papa from 'papaparse';

import { Superteams } from '@/constants/Superteam';
import { type Skills } from '@/interface/skills';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { csvUpload, str2ab } from '@/utils/cloudinary';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithSponsor } from '@/features/auth/types';
import { withSponsorAuth } from '@/features/auth/utils/withSponsorAuth';

async function handler(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  const userId = req.userId;
  const userSponsorId = req.userSponsorId;

  logger.debug(`Request query: ${safeStringify(req.query)}`);

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId as string },
      select: { stLead: true },
    });

    const sponsor = await prisma.sponsors.findUnique({
      where: { id: userSponsorId },
      select: { name: true },
    });

    const superteam = Superteams.find((st) => st.name === sponsor?.name);
    if (!superteam) {
      return res.status(403).json({ error: 'Invalid sponsor' });
    }

    const region = superteam.region;
    const countries = superteam.country;

    const isLocalProfileVisible =
      user?.stLead === region || user?.stLead === 'MAHADEV';

    if (!isLocalProfileVisible) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const users = await prisma.user.findMany({
      where: { location: { in: countries } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        skills: true,
        telegram: true,
        twitter: true,
        website: true,
        discord: true,
        username: true,
        photo: true,
        bio: true,
        community: true,
        interests: true,
        Submission: {
          select: {
            isWinner: true,
            rewardInUSD: true,
            listing: {
              select: {
                isWinnersAnnounced: true,
              },
            },
          },
        },
        GrantApplication: {
          select: {
            approvedAmountInUSD: true,
            applicationStatus: true,
          },
        },
      },
    });

    const processedUsers = users.map((user) => {
      const totalSubmissions = user.Submission.length;
      const wins = user.Submission.filter(
        (s) => s.isWinner && s.listing.isWinnersAnnounced,
      ).length;

      const listingWinnings = user.Submission.filter(
        (s) => s.isWinner && s.listing.isWinnersAnnounced,
      ).reduce((sum, submission) => sum + (submission.rewardInUSD || 0), 0);

      const grantWinnings = user.GrantApplication.filter(
        (g) => g.applicationStatus === 'Approved',
      ).reduce(
        (sum, application) => sum + (application.approvedAmountInUSD || 0),
        0,
      );

      const totalEarnings = listingWinnings + grantWinnings;

      return { ...user, totalSubmissions, wins, totalEarnings };
    });

    const rankedUsers = processedUsers
      .sort((a, b) => b.totalEarnings - a.totalEarnings)
      .map((user, index) => ({
        ...user,
        rank: index + 1,
      }));

    logger.debug('Transforming users to JSON format for CSV export');
    const finalJson = rankedUsers.map((user) => {
      const parentSkills = (user?.skills as Skills)?.map(
        (skill: any) => skill.skills,
      );
      const subSkills = (user?.skills as Skills)?.flatMap(
        (skill: any) => skill.subskills,
      );
      const communities = JSON.parse(user?.community || '[]');
      const interests = JSON.parse(user?.interests || '[]');

      return {
        Rank: user.rank,
        Name: `${user.firstName} ${user.lastName}`,
        'Email ID': user.email,
        'Profile Link': `https://earn.superteam.fun/t/${user.username}`,
        Wins: user.wins,
        Submissions: user.totalSubmissions,
        'Total Earnings': `$${user.totalEarnings.toLocaleString('en-us', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`,
        Bio: user.bio,
        Skills: parentSkills.length > 0 ? parentSkills.join(', ') : '-',
        Subkills: subSkills.length > 0 ? subSkills.join(', ') : '-',
        Interests: interests.length > 0 ? interests.join(', ') : '-',
        Communities: communities.length > 0 ? communities.join(', ') : '-',
      };
    });

    logger.debug('Converting JSON to CSV');
    const csv = Papa.unparse(finalJson);
    const fileName = `${region}-local-profiles-${Date.now()}`;
    const file = str2ab(csv, fileName);

    logger.debug('Uploading CSV to Cloudinary');
    const cloudinaryDetails = await csvUpload(file, fileName, region);

    logger.info(`CSV export successful for region: ${region}`);
    return res.status(200).json({
      url: cloudinaryDetails?.secure_url || cloudinaryDetails?.url,
    });
  } catch (error: any) {
    logger.error(
      `User ${userId} unable to download CSV: ${safeStringify(error)}`,
    );
    return res.status(400).json({
      error: error.message || error.toString(),
      message: `Error occurred while exporting users of local region.`,
    });
  }
}

export default withSponsorAuth(handler);
