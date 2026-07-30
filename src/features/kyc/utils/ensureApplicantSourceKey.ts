import axios from 'axios';

import logger from '@/lib/logger';
import { safeStringify } from '@/utils/safeStringify';

import { SUMSUB_BASE_URL } from '../constants/SUMSUB_BASE_URL';
import { createSumSubHeaders } from './createSumSubHeaders';

type SumsubApplicant = {
  id?: string;
  sourceKey?: string;
};

const getApplicantByExternalUserId = async (
  userId: string,
  secretKey: string,
  appToken: string,
): Promise<SumsubApplicant | null> => {
  const url = `/resources/applicants/-;externalUserId=${userId}/one`;
  const method = 'GET';
  const body = '';
  const headers = createSumSubHeaders(method, url, body, secretKey, appToken);

  try {
    const response = await axios.get<SumsubApplicant>(`${SUMSUB_BASE_URL}${url}`, {
      headers,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }

    logger.warn('Skipping Sumsub source key lookup after error', {
      userId,
      error: safeStringify(error),
    });
    return null;
  }
};

const createApplicantWithSourceKey = async ({
  userId,
  levelName,
  sourceKey,
  secretKey,
  appToken,
}: {
  userId: string;
  levelName: string;
  sourceKey: string;
  secretKey: string;
  appToken: string;
}) => {
  const url = `/resources/applicants?levelName=${encodeURIComponent(levelName)}`;
  const method = 'POST';
  const body = JSON.stringify({
    externalUserId: userId,
    sourceKey,
  });
  const headers = createSumSubHeaders(method, url, body, secretKey, appToken);

  try {
    await axios.post(
      `${SUMSUB_BASE_URL}${url}`,
      {
        externalUserId: userId,
        sourceKey,
      },
      { headers },
    );
    return true;
  } catch (error) {
    if (
      axios.isAxiosError(error) &&
      (error.response?.status === 409 ||
        safeStringify(error.response?.data).toLowerCase().includes('exist'))
    ) {
      logger.info('Sumsub applicant already exists during source key setup', {
        userId,
        sourceKey,
      });
      return false;
    }

    logger.warn('Skipping Sumsub source key setup after create error', {
      userId,
      sourceKey,
      error: safeStringify(error),
    });
    return false;
  }
};

export const ensureApplicantSourceKey = async ({
  userId,
  levelName,
  sourceKey,
  secretKey,
  appToken,
}: {
  userId: string;
  levelName: string;
  sourceKey: string;
  secretKey: string;
  appToken: string;
}) => {
  const applicant = await getApplicantByExternalUserId(
    userId,
    secretKey,
    appToken,
  );

  if (!applicant?.id) {
    return createApplicantWithSourceKey({
      userId,
      levelName,
      sourceKey,
      secretKey,
      appToken,
    });
  }

  if (applicant.sourceKey !== sourceKey) {
    logger.info('Leaving existing Sumsub applicant source key unchanged', {
      applicantId: applicant.id,
      userId,
      sourceKey,
    });
  }

  return false;
};
