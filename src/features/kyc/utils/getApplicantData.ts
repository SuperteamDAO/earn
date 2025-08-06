import axios from 'axios';

import logger from '@/lib/logger';
import { safeStringify } from '@/utils/safeStringify';

import { SUMSUB_BASE_URL } from '../constants/SUMSUB_BASE_URL';
import { createSumSubHeaders } from './createSumSubHeaders';
import { handleSumSubError } from './handleSumSubError';

export const getApplicantData = async (
  userId: string,
  secretKey: string,
  appToken: string,
): Promise<{
  id: string;
  fullName: string;
  country: string;
  address: string;
  dob: string;
  idNumber: string;
  idType: string;
}> => {
  const applicantUrl = `/resources/applicants/-;externalUserId=${userId}/one`;
  const method = 'GET';
  const body = '';

  const headers = createSumSubHeaders(
    method,
    applicantUrl,
    body,
    secretKey,
    appToken,
  );

  try {
    const applicantResponse = await axios.get(
      `${SUMSUB_BASE_URL}${applicantUrl}`,
      { headers },
    );

    const id = applicantResponse.data.id;
    if (!id) {
      throw new Error('Sumsub: Applicant ID not found in response');
    }

    const info = applicantResponse.data.info;

    const firstName = info.firstNameEn || '';
    const middleName = info.middleNameEn || '';
    const lastName = info.lastNameEn || '';
    const fullName = `${firstName} ${middleName} ${lastName}`
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    const country = info.country || '';
    const dob = info.dob || '';

    const statusUrl = `/resources/applicants/${id}/requiredIdDocsStatus`;
    const statusHeaders = createSumSubHeaders(
      method,
      statusUrl,
      body,
      secretKey,
      appToken,
    );

    const statusResponse = await axios.get(`${SUMSUB_BASE_URL}${statusUrl}`, {
      headers: statusHeaders,
    });

    const identityStep = statusResponse.data.IDENTITY;
    let approvedIdDoc = null;

    if (identityStep && identityStep.imageReviewResults) {
      const approvedImageId = Object.keys(identityStep.imageReviewResults).find(
        (imageId) =>
          identityStep.imageReviewResults[imageId].reviewAnswer === 'GREEN',
      );

      if (approvedImageId) {
        const approvedImageIndex = identityStep.imageIds.indexOf(
          parseInt(approvedImageId),
        );
        if (approvedImageIndex !== -1 && info.idDocs?.[approvedImageIndex]) {
          approvedIdDoc = info.idDocs[approvedImageIndex];
          logger.info(
            `Found approved ID document at index ${approvedImageIndex} for applicant ${id}`,
          );
        } else {
          logger.warn(
            `Approved image ID ${approvedImageId} not found in imageIds array for applicant ${id}`,
          );
        }
      } else {
        logger.warn(
          `No approved (GREEN) ID documents found for applicant ${id}`,
        );
      }
    } else {
      logger.warn(
        `No IDENTITY step or imageReviewResults found for applicant ${id}`,
      );
    }

    if (!approvedIdDoc && info.idDocs?.[0]) {
      logger.warn(
        `No approved ID document found for applicant ${id}, using first document as fallback`,
      );
      approvedIdDoc = info.idDocs[0];
    }

    if (!approvedIdDoc) {
      logger.error(`No ID documents available for applicant ${id}`);
      throw new Error('Sumsub: No ID documents found for applicant');
    }

    const formattedAddress = approvedIdDoc?.address?.formattedAddress;
    const address = formattedAddress ? formattedAddress : null;
    const idNumber = approvedIdDoc?.number || '';
    const idType = approvedIdDoc?.idDocType || '';

    return {
      id,
      fullName,
      country,
      address,
      dob,
      idNumber,
      idType,
    };
  } catch (error) {
    logger.error(
      `Failed to get applicant data from Sumsub for userId ${userId}: ${safeStringify(error)}`,
    );

    if (axios.isAxiosError(error)) {
      throw new Error(
        `Sumsub: ${error.message || 'Failed to retrieve applicant data'}`,
      );
    }

    handleSumSubError(error);
    throw new Error('Sumsub: Failed to retrieve applicant data');
  }
};
