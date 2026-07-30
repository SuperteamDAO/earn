import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser } from '@/features/auth/types';
import { withAuth } from '@/features/auth/utils/withAuth';
import { createSumsubAccessToken } from '@/features/kyc/utils/createSumsubAccessToken';
import { ensureApplicantSourceKey } from '@/features/kyc/utils/ensureApplicantSourceKey';
import { isEligiblePeopleType } from '@/features/membership/utils/peopleEligibility';
import { prisma } from '@/prisma';

const handler = async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const userId = req.userId;

  try {
    const secretKey = process.env.SUMSUB_SECRET_KEY;
    const appToken = process.env.SUMSUB_API_KEY;
    const levelName = process.env.SUMSUB_LEVEL_NAME;
    const memberSourceKey = process.env.SUMSUB_MEMBER_SOURCE_KEY;

    if (!secretKey || !appToken || !userId || !levelName) {
      return res.status(500).json({ message: 'Missing environment variables' });
    }

    if (memberSourceKey) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          people: {
            select: {
              type: true,
            },
          },
        },
      });

      if (isEligiblePeopleType(user?.people?.type)) {
        await ensureApplicantSourceKey({
          userId,
          levelName,
          sourceKey: memberSourceKey,
          secretKey,
          appToken,
        });
      }
    }

    const result = await createSumsubAccessToken(
      userId,
      levelName,
      secretKey,
      appToken,
    );

    return res.status(200).json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return res.status(400).json({ message });
  }
};

export default withAuth(handler);
