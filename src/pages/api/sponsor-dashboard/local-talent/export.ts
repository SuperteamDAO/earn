import type { NextApiResponse } from 'next';
import Papa from 'papaparse';

import { type Prisma } from '@/generated/prisma/client';
import { type Skills } from '@/interface/skills';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { csvUpload, str2ab } from '@/utils/cloudinary';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithSponsor } from '@/features/auth/types';
import { withSponsorAuth } from '@/features/auth/utils/withSponsorAuth';

async function handler(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  const params = req.query;
  const userId = req.userId;

  logger.debug(`Query params: ${safeStringify(params)}`);

  const superteamRegion = params.superteamRegion as string;
  const superteamCountriesParam = params.superteamCountries as
    | string
    | string[];

  let superteamCountries: string[];
  if (typeof superteamCountriesParam === 'string') {
    superteamCountries = superteamCountriesParam.includes(',')
      ? superteamCountriesParam.split(',').map((c) => c.trim())
      : [superteamCountriesParam];
  } else if (Array.isArray(superteamCountriesParam)) {
    superteamCountries = superteamCountriesParam;
  } else {
    superteamCountries = [];
  }

  if (!superteamRegion || !superteamCountries.length) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    const requestingUser = await prisma.user.findUnique({
      where: { id: userId as string },
      select: { stLead: true },
    });

    const leadRegion = requestingUser?.stLead;

    if (
      leadRegion?.toLowerCase() !== superteamRegion.toLowerCase() &&
      leadRegion !== 'MAHADEV'
    ) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    logger.debug('Fetching user details with optimized query');

    const localTalentSelect = {
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
      createdAt: true,
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
    } satisfies Prisma.UserSelect;

    const BATCH_SIZE = 10000;
    const localTalent: Prisma.UserGetPayload<{
      select: typeof localTalentSelect;
    }>[] = [];
    let cursor: string | undefined = undefined;

    while (true) {
      const batch: Prisma.UserGetPayload<{
        select: typeof localTalentSelect;
      }>[] = await prisma.user.findMany({
        where: { location: { in: superteamCountries } },
        select: localTalentSelect,
        take: BATCH_SIZE,
        ...(cursor && { skip: 1, cursor: { id: cursor } }),
        orderBy: { id: 'asc' },
      });

      localTalent.push(...batch);

      if (batch.length < BATCH_SIZE) {
        break;
      }

      cursor = batch[batch.length - 1]!.id;
    }

    const talentWithStats = localTalent.map((talent) => {
      const totalSubmissions = talent.Submission.length;
      const wins = talent.Submission.filter(
        (s) => s.isWinner && s.listing.isWinnersAnnounced,
      ).length;

      const listingWinnings = talent.Submission.filter(
        (s) => s.isWinner && s.listing.isWinnersAnnounced,
      ).reduce((sum, submission) => sum + (submission.rewardInUSD || 0), 0);

      const grantWinnings = talent.GrantApplication.filter(
        (g) => g.applicationStatus === 'Approved',
      ).reduce(
        (sum, application) => sum + (application.approvedAmountInUSD || 0),
        0,
      );

      const totalEarnings = listingWinnings + grantWinnings;

      return { ...talent, totalSubmissions, wins, totalEarnings };
    });

    const rankedTalent = talentWithStats
      .sort((a, b) => b.totalEarnings - a.totalEarnings)
      .map((talent, index) => ({
        ...talent,
        rank: index + 1,
      }));

    logger.debug('Transforming users to JSON format for CSV export');
    const finalJson = rankedTalent.map((user) => {
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
    const fileName = `${superteamRegion}-local-profiles-${Date.now()}`;
    const file = str2ab(csv, fileName);

    logger.debug('Uploading CSV to Cloudinary');
    const cloudinaryDetails = await csvUpload(file, fileName, superteamRegion);

    logger.info(`CSV export successful for region: ${superteamRegion}`);
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
