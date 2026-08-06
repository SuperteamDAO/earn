import axios from 'axios';
import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithUser } from '@/features/auth/types';
import { withAuth } from '@/features/auth/utils/withAuth';
import { SUMSUB_BASE_URL } from '@/features/kyc/constants/SUMSUB_BASE_URL';
import { type SumSubBaseResponse } from '@/features/kyc/types/SumSubBaseResponse';
import { createSumSubHeaders } from '@/features/kyc/utils/createSumSubHeaders';
import { ensureApplicantSourceKey } from '@/features/kyc/utils/ensureApplicantSourceKey';
import { handleSumSubError } from '@/features/kyc/utils/handleSumSubError';
import { isEligiblePeopleType } from '@/features/membership/utils/peopleEligibility';

type PeopleTypeLookupResult =
  | {
      readonly ok: true;
      readonly peopleType: string | null | undefined;
    }
  | {
      readonly ok: false;
    };

const createSumsubToken = async (
  userId: string,
  levelName: string,
  secretKey: string,
  appToken: string,
) => {
  const url = '/resources/accessTokens/sdk';
  const method = 'POST';
  const body = JSON.stringify({
    ttlInSecs: 600,
    userId,
    levelName,
  });

  const headers = createSumSubHeaders(method, url, body, secretKey, appToken);

  try {
    const response = await axios.post<SumSubBaseResponse>(
      `${SUMSUB_BASE_URL}${url}`,
      { ttlInSecs: 600, userId, levelName },
      { headers },
    );
    return response.data;
  } catch (error) {
    handleSumSubError(error);
    throw error;
  }
};

const getEligiblePeopleType = async (
  userId: string,
): Promise<PeopleTypeLookupResult> => {
  try {
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

    return { ok: true, peopleType: user?.people?.type };
  } catch (error) {
    logger.warn('Skipping Sumsub member source key setup after lookup error', {
      userId,
      error: safeStringify(error),
    });
    return { ok: false };
  }
};

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
      const peopleTypeLookup = await getEligiblePeopleType(userId);

      if (
        peopleTypeLookup.ok &&
        isEligiblePeopleType(peopleTypeLookup.peopleType)
      ) {
        await ensureApplicantSourceKey({
          userId,
          levelName,
          sourceKey: memberSourceKey,
          secretKey,
          appToken,
        });
      }
    }

    const result = await createSumsubToken(
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
