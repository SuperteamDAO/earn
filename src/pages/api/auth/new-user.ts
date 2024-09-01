import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

import { handleInviteAcceptance } from '@/features/auth';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

export default async function newUser(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  logger.debug(`Request body: ${safeStringify(req.body)}`);

  try {
    const token = await getToken({ req });

    if (!token) {
      logger.warn('Unauthorized request - No token provided');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = token.id;

    if (!userId) {
      logger.warn('Invalid token - No user ID found');
      return res.status(400).json({ error: 'Invalid token' });
    }

    logger.debug(`Fetching user data for user ID: ${userId}`);
    const user = await prisma.user.findUnique({
      where: { id: userId as string },
    });

    logger.debug(`Fetching invite data for user email: ${user?.email}`);
    const invite = await prisma.userInvites.findFirst({
      where: {
        email: user?.email,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const hasInvite = user && invite;

    if (!hasInvite) {
      logger.info('User does not have an invite, redirecting to onboarding');
      return res
        .status(307)
        .redirect('/new?onboarding=true&loginState=signedIn');
    } else {
      const result = await handleInviteAcceptance(userId as string);
      logger.info('User has an invite, redirecting to dashboard');
      return res.status(307).redirect(result.redirectUrl!);
    }
  } catch (error: any) {
    logger.error(
      `Error occurred while processing new user: ${safeStringify(error)}`,
    );
    return res.status(400).json({
      error,
      message: 'Error occurred while processing new user.',
    });
  }
}
