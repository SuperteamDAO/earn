import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithSponsor } from '@/features/auth/types';
import { withSponsorAuth } from '@/features/auth/utils/withSponsorAuth';

// TODO: I think we can have a more elegant solution for this.
async function handler(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  const sponsorId = req.userSponsorId;
  const params = req.query;
  const searchText = params.searchText as string;
  const skip = params.skip ? parseInt(params.skip as string, 10) : 0;
  const take = params.take ? parseInt(params.take as string, 10) : 15;

  logger.debug(`Query params: ${safeStringify(params)}`);
  logger.debug(`Sponsor ID: ${sponsorId}`);

  // Only fetch invites that haven't expired
  const now = new Date();

  try {
    // First, if there's a search text, check if it matches any existing users
    let userMatchingEmails: string[] = [];

    if (searchText) {
      logger.debug('Searching for users matching the search text');
      const matchingUsers = await prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: searchText } },
            { firstName: { contains: searchText } },
            { lastName: { contains: searchText } },
            { email: { contains: searchText } },
          ],
        },
        select: {
          email: true,
        },
      });

      userMatchingEmails = matchingUsers.map((user) => user.email);
      logger.debug(
        `Found ${userMatchingEmails.length} users matching search criteria`,
      );
    }

    // Now construct the where clause for the invites query
    const whereSearch = searchText
      ? {
          OR: [
            { email: { contains: searchText } },
            { email: { in: userMatchingEmails } },
          ],
        }
      : {};

    logger.debug('Fetching total count of pending invites');
    const total = await prisma.userInvites.count({
      where: {
        sponsorId: sponsorId as string,
        expires: {
          gt: now,
        },
        ...whereSearch,
      },
    });

    logger.debug('Fetching pending invites');
    const invites = await prisma.userInvites.findMany({
      where: {
        sponsorId: sponsorId as string,
        expires: {
          gt: now,
        },
        ...whereSearch,
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true,
            photo: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take,
    });

    // Enhance invites with user information if the email exists in the system
    logger.debug('Checking if invited emails correspond to existing users');
    const enhancedInvites = await Promise.all(
      invites.map(async (invite) => {
        const existingUser = await prisma.user.findUnique({
          where: { email: invite.email },
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true,
            photo: true,
          },
        });

        return {
          ...invite,
          invitedUser: existingUser,
        };
      }),
    );

    logger.info('Successfully fetched pending invites');
    res.status(200).json({ total, data: enhancedInvites });
  } catch (err: any) {
    logger.error(`Error fetching pending invites: ${safeStringify(err)}`);
    res.status(400).json({ error: 'Error occurred while fetching invites.' });
  }
}

export default withSponsorAuth(handler);
