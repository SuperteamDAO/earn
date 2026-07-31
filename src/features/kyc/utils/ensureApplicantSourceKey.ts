import axios from 'axios';

import logger from '@/lib/logger';
import { safeStringify } from '@/utils/safeStringify';

import { SUMSUB_BASE_URL } from '../constants/SUMSUB_BASE_URL';
import { createSumSubHeaders } from './createSumSubHeaders';

type SumsubApplicant = {
  readonly id: string | undefined;
  readonly sourceKey: string | undefined;
};

type SumsubErrorResponse = {
  readonly code: unknown;
  readonly message: unknown;
  readonly description: unknown;
};

const SUMSUB_SOURCE_KEY_REQUEST_TIMEOUT_MS = 10_000;

const matchesDuplicateApplicantMessage = (value: unknown): boolean =>
  typeof value === 'string' &&
  [
    'applicant already exists',
    'applicant with externaluserid already exists',
  ].includes(value.toLowerCase());

const isApplicantAlreadyExistsError = (error: unknown): boolean => {
  if (!axios.isAxiosError(error)) {
    return false;
  }

  if (error.response?.status === 409) {
    return true;
  }

  const data = error.response?.data as Partial<SumsubErrorResponse> | undefined;

  return (
    data?.code === 'applicant_already_exists' ||
    data?.code === 'applicant_exists' ||
    matchesDuplicateApplicantMessage(data?.message) ||
    matchesDuplicateApplicantMessage(data?.description)
  );
};

const getApplicantByExternalUserId = async (
  userId: string,
  secretKey: string,
  appToken: string,
): Promise<SumsubApplicant | null | undefined> => {
  const url = `/resources/applicants/-;externalUserId=${userId}/one`;
  const method = 'GET';
  const body = '';
  const headers = createSumSubHeaders(method, url, body, secretKey, appToken);

  try {
    const response = await axios.get<SumsubApplicant>(`${SUMSUB_BASE_URL}${url}`, {
      headers,
      timeout: SUMSUB_SOURCE_KEY_REQUEST_TIMEOUT_MS,
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
    return undefined;
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
}): Promise<void> => {
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
      { headers, timeout: SUMSUB_SOURCE_KEY_REQUEST_TIMEOUT_MS },
    );
    logger.info('Created Sumsub applicant with member source key', {
      userId,
      sourceKey,
    });
  } catch (error) {
    if (isApplicantAlreadyExistsError(error)) {
      logger.info('Sumsub applicant already exists during source key setup', {
        userId,
        sourceKey,
      });
      return;
    }

    logger.warn('Skipping Sumsub source key setup after create error', {
      userId,
      sourceKey,
      error: safeStringify(error),
    });
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
}): Promise<void> => {
  const applicant = await getApplicantByExternalUserId(
    userId,
    secretKey,
    appToken,
  );

  if (applicant === undefined) {
    return;
  }

  if (!applicant?.id) {
    await createApplicantWithSourceKey({
      userId,
      levelName,
      sourceKey,
      secretKey,
      appToken,
    });
    return;
  }

  if (applicant.sourceKey !== sourceKey) {
    logger.info('Leaving existing Sumsub applicant source key unchanged', {
      applicantId: applicant.id,
      userId,
      sourceKey,
    });
  }
};
