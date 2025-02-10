import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithUser } from '@/features/auth/types';
import { withAuth } from '@/features/auth/utils/withAuth';
import { extractSocialUsername } from '@/features/social/utils/extractUsername';
import { sponsorVerificationSchema } from '@/features/sponsor/utils/sponsorVerificationSchema';

async function verification(req: NextApiRequestWithUser, res: NextApiResponse) {
  const { userId } = req;

  logger.debug(`Request body: ${safeStringify(req.body)}`);
  const { telegram, ...rest } = req.body;
  const telegramUsernameExtracted = extractSocialUsername('telegram', telegram);

  const data = {
    ...rest,
    telegram: telegramUsernameExtracted,
  };

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const validationResult = sponsorVerificationSchema.safeParse(data);

    if (!validationResult.success) {
      return res.status(400).json({
        error: JSON.stringify(validationResult.error.formErrors),
        message: 'Invalid verification data',
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId as string,
      },
    });

    if (!user || !user.currentSponsorId) {
      return res.status(404).json({ message: 'User not found' });
    }

    const sponsor = await prisma.sponsors.update({
      where: {
        id: user.currentSponsorId,
      },
      data: {
        verificationInfo: validationResult.data,
      },
    });

    return res.status(200).json(sponsor);
  } catch (error: any) {
    logger.error(
      `User ${userId} unable to update verification: ${safeStringify(error)}`,
    );

    return res.status(500).json({
      error: error.message,
      message: `User ${userId} unable to update verification: ${error.message}`,
    });
  }
}

export default withAuth(verification);
