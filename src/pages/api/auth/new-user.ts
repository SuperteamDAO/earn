import type { NextApiRequest, NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { getPrivyToken } from '@/features/auth/utils/getPrivyToken';
import { handleInviteAcceptance } from '@/features/auth/utils/handleInvite';

export default async function newUser(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  logger.debug(`Request body: ${safeStringify(req.body)}`);

  try {
    const privyDid = await getPrivyToken(req);

    if (!privyDid) {
      logger.warn('Unauthorized request - No token provided');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    logger.debug(`Fetching user data for privy ID: ${privyDid}`);
    const user = await prisma.user.findUnique({
      where: { privyDid },
    });

    if (!user) {
      logger.warn('Invalid token - No user ID found');
      return res.status(400).json({ error: 'Invalid token' });
    }

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
      const result = await handleInviteAcceptance(user.id as string);
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
