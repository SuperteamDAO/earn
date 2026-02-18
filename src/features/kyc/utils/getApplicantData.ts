import axios from 'axios';

import logger from '@/lib/logger';
import { safeStringify } from '@/utils/safeStringify';

import { SUMSUB_BASE_URL } from '../constants/SUMSUB_BASE_URL';
import { createSumSubHeaders } from './createSumSubHeaders';
import { handleSumSubError } from './handleSumSubError';

const parseSumsubDate = (value: unknown): Date | null => {
  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getDocumentExpiryDate = (doc: any): Date | null => {
  const candidates = [doc?.extendedValidUntil, doc?.validUntil]
    .map(parseSumsubDate)
    .filter((date): date is Date => date !== null);

  if (candidates.length === 0) {
    return null;
  }

  return candidates.reduce((latest, current) =>
    current.getTime() > latest.getTime() ? current : latest,
  );
};

export const getApplicantData = async (
  userId: string,
  secretKey: string,
  appToken: string,
): Promise<{
  id: string;
  fullName: string;
  country: string;
  dob: string;
  idNumber: string;
  idType: string;
  documentExpiresAt: Date | null;
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

    // Collect accepted image IDs (reviewAnswer === GREEN) from either imageStatuses or imageReviewResults
    const acceptedImageIds: number[] = [];
    if (identityStep) {
      // Prefer imageStatuses if available (newer/structured)
      if (Array.isArray(identityStep.imageStatuses)) {
        for (const imgStatus of identityStep.imageStatuses as any[]) {
          const reviewAnswer = imgStatus?.reviewResult?.reviewAnswer;
          const imageId = imgStatus?.imageId;
          if (
            reviewAnswer === 'GREEN' &&
            (typeof imageId === 'number' || typeof imageId === 'string')
          ) {
            const parsed =
              typeof imageId === 'string' ? parseInt(imageId, 10) : imageId;
            if (!Number.isNaN(parsed)) acceptedImageIds.push(parsed);
          }
        }
      }

      // Fallback to imageReviewResults if imageStatuses is absent
      if (acceptedImageIds.length === 0 && identityStep.imageReviewResults) {
        const entries = Object.entries(
          identityStep.imageReviewResults as Record<string, any>,
        );
        for (const [imageIdStr, result] of entries) {
          if (result?.reviewAnswer === 'GREEN') {
            const parsed = parseInt(imageIdStr, 10);
            if (!Number.isNaN(parsed)) acceptedImageIds.push(parsed);
          }
        }
      }
    } else {
      logger.warn(`No IDENTITY step found for applicant ${id}`);
    }

    // Helper to extract image IDs from a document object in applicant info
    const extractDocImageIds = (doc: any): number[] => {
      const ids = new Set<number>();
      if (!doc || typeof doc !== 'object') return [];

      // Common shapes observed in Sumsub payloads
      const possibleArrays = ['imageIds', 'images', 'pages', 'sides'];
      for (const key of possibleArrays) {
        const value = (doc as any)[key];
        if (Array.isArray(value)) {
          for (const item of value) {
            const candidate =
              typeof item === 'number'
                ? item
                : typeof item === 'string'
                  ? parseInt(item, 10)
                  : typeof item?.imageId === 'number'
                    ? item.imageId
                    : typeof item?.imageId === 'string'
                      ? parseInt(item.imageId, 10)
                      : typeof item?.id === 'number'
                        ? item.id
                        : typeof item?.id === 'string'
                          ? parseInt(item.id, 10)
                          : undefined;
            if (typeof candidate === 'number' && !Number.isNaN(candidate)) {
              ids.add(candidate);
            }
          }
        }
      }

      // Some payloads may store a single image id
      const singleCandidates = ['imageId', 'id'];
      for (const key of singleCandidates) {
        const value = (doc as any)[key];
        if (typeof value === 'number' && !Number.isNaN(value)) ids.add(value);
        if (typeof value === 'string') {
          const parsed = parseInt(value, 10);
          if (!Number.isNaN(parsed)) ids.add(parsed);
        }
      }

      return Array.from(ids);
    };

    // Try to correlate accepted images to the correct idDoc
    if (Array.isArray(info.idDocs) && info.idDocs.length > 0) {
      let bestMatchDoc: any = null;
      let bestMatchCount = -1;
      for (const doc of info.idDocs as any[]) {
        const docImageIds = extractDocImageIds(doc);
        if (docImageIds.length === 0) continue;
        const matchCount = docImageIds.filter((idNum) =>
          acceptedImageIds.includes(idNum),
        ).length;
        if (matchCount > bestMatchCount) {
          bestMatchCount = matchCount;
          bestMatchDoc = doc;
        }
      }
      if (bestMatchDoc && bestMatchCount > 0) {
        approvedIdDoc = bestMatchDoc;
        logger.info(
          `Mapped accepted GREEN image(s) ${JSON.stringify(acceptedImageIds)} to an idDoc with ${bestMatchCount} matching image(s) for applicant ${id}`,
        );
      }
    }

    // If still not found, try a heuristic by matching step-level fields
    if (!approvedIdDoc && identityStep) {
      const stepDocType = identityStep.idDocType;
      const stepCountry = identityStep.country;
      if (Array.isArray(info.idDocs) && info.idDocs.length > 0) {
        const byType = info.idDocs.find(
          (d: any) =>
            d?.idDocType && stepDocType && d.idDocType === stepDocType,
        );
        const byCountry = info.idDocs.find(
          (d: any) => d?.country && stepCountry && d.country === stepCountry,
        );
        approvedIdDoc = byType || byCountry || null;
        if (approvedIdDoc) {
          logger.info(
            `Selected idDoc by heuristic (type/country match) for applicant ${id}`,
          );
        }
      }
    }

    // Final fallback to the first document to avoid missing data entirely
    if (!approvedIdDoc && info.idDocs?.[0]) {
      logger.warn(
        `No accepted idDoc matched by images for applicant ${id}, using first document as fallback`,
      );
      approvedIdDoc = info.idDocs[0];
    }

    if (!approvedIdDoc) {
      logger.error(`No ID documents available for applicant ${id}`);
      throw new Error('Sumsub: No ID documents found for applicant');
    }

    const idNumber = approvedIdDoc?.number || '';
    const idType = approvedIdDoc?.idDocType || '';
    const documentExpiresAt = getDocumentExpiryDate(approvedIdDoc);

    return {
      id,
      fullName,
      country,
      dob,
      idNumber,
      idType,
      documentExpiresAt,
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
