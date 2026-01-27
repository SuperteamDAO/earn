import logger from '@/lib/logger';
import { prisma } from '@/prisma';

import { addOnboardingInfoToAirtable } from './addOnboardingInfoToAirtable';
import { addPaymentInfoToAirtable } from './addPaymentInfoToAirtable';
import { isTouchingGrassSlug } from './touchingGrass';

const CLOUDINARY_HOST = 'res.cloudinary.com';
const MAX_EVENT_PICTURES = 5;
const MAX_EVENT_RECEIPTS = 10;

const parseHttpUrl = (value: string): URL | null => {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

const isCloudinaryUrl = (value: string) => {
  const parsed = parseHttpUrl(value);
  if (!parsed) return false;
  const host = parsed.hostname.toLowerCase();
  return host === CLOUDINARY_HOST || host.endsWith(`.${CLOUDINARY_HOST}`);
};

const normalizeImageUrls = (
  value: unknown,
  { label, required, max }: { label: string; required: boolean; max: number },
): string[] | undefined => {
  if (value === undefined || value === null) {
    if (required) {
      throw new Error(`${label} are required.`);
    }
    return undefined;
  }
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be a list of image URLs.`);
  }
  if (value.length === 0) {
    if (required) {
      throw new Error(`At least one ${label.toLowerCase()} is required.`);
    }
    return undefined;
  }
  if (value.length > max) {
    throw new Error(`${label} must be ${max} or fewer images.`);
  }
  return value.map((entry) => {
    if (typeof entry !== 'string') {
      throw new Error(`${label} must contain valid image URLs.`);
    }
    const trimmed = entry.trim();
    if (!isCloudinaryUrl(trimmed)) {
      throw new Error(`${label} must be Cloudinary image URLs.`);
    }
    return trimmed;
  });
};

const normalizeSocialPost = (
  value: unknown,
  required: boolean,
): string | undefined => {
  if (value === undefined || value === null || value === '') {
    if (required) {
      throw new Error('Social post link is required.');
    }
    return undefined;
  }
  if (typeof value !== 'string') {
    throw new Error('Social post link must be a valid URL.');
  }
  const trimmed = value.trim();
  const urlCandidate =
    trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `https://${trimmed}`;
  const parsed = parseHttpUrl(urlCandidate);
  if (!parsed) {
    throw new Error('Social post link must be a valid URL.');
  }
  return parsed.toString();
};

const normalizeAttendeeCount = (
  value: unknown,
  required: boolean,
): number | undefined => {
  if (value === undefined || value === null || value === '') {
    if (required) {
      throw new Error('Attendee count is required.');
    }
    return undefined;
  }
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0 || !Number.isInteger(parsed)) {
    throw new Error('Attendee count must be a positive whole number.');
  }
  return parsed;
};

type CreateTrancheProps = {
  applicationId: string;
  helpWanted?: string;
  update?: string;
  walletAddress?: string;
  isFirstTranche?: boolean;
  eventPictures?: string[];
  eventReceipts?: string[];
  attendeeCount?: number;
  socialPost?: string;
};

export async function createTranche({
  applicationId,
  helpWanted,
  update,
  walletAddress,
  isFirstTranche,
  eventPictures,
  eventReceipts,
  attendeeCount,
  socialPost,
}: CreateTrancheProps) {
  const application = await prisma.grantApplication.findUniqueOrThrow({
    where: { id: applicationId },
    include: {
      GrantTranche: {
        orderBy: { createdAt: 'asc' },
      },
      grant: true,
      user: true,
    },
  });

  if (application.user.isKYCVerified !== true) {
    const errorMessage = `User is not verified for application ${applicationId}`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }

  const isTouchingGrass = isTouchingGrassSlug(application.grant?.slug);
  const requiresEventProof = isTouchingGrass && !isFirstTranche;

  const existingTranches = application.GrantTranche.filter(
    (tranche) => tranche.status !== 'Rejected',
  ).length;
  const maxTranches = 4;

  if (existingTranches >= maxTranches) {
    const errorMessage = `All tranches have already been created for application ${applicationId}`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }

  if (isFirstTranche && existingTranches > 0) {
    const cutoff = new Date('2025-04-17');
    const allExistingCreatedAt = application.GrantTranche.every(
      (tranche) => new Date(tranche.createdAt) < cutoff,
    );

    if (allExistingCreatedAt) {
      logger.info(
        `Skipping first tranche creation for application ${applicationId} as existing tranches were created before the cutoff date.`,
      );
      return null;
    }

    const errorMessage = `Cannot create first tranche when tranches already exist for application ${applicationId} (created after cutoff)`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }

  if (!isFirstTranche && existingTranches === 0) {
    const errorMessage = `Cannot create non-first tranche when no tranches exist for application ${applicationId}`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }

  if (existingTranches > 0) {
    const previousTranche = application.GrantTranche[existingTranches - 1];
    if (
      previousTranche &&
      previousTranche.status !== 'Paid' &&
      previousTranche.status !== 'Rejected'
    ) {
      const errorMessage = `Previous tranche (ID: ${previousTranche.id}) must be paid before requesting a new tranche for application ${applicationId}`;
      logger.error(errorMessage);
      throw new Error(errorMessage);
    }
  }

  const normalizedEventPictures = normalizeImageUrls(eventPictures, {
    label: 'Event pictures',
    required: requiresEventProof,
    max: MAX_EVENT_PICTURES,
  });
  const normalizedEventReceipts = normalizeImageUrls(eventReceipts, {
    label: 'Event receipts',
    required: requiresEventProof,
    max: MAX_EVENT_RECEIPTS,
  });
  const normalizedAttendeeCount = normalizeAttendeeCount(
    attendeeCount,
    requiresEventProof,
  );
  const normalizedSocialPost = normalizeSocialPost(
    socialPost,
    requiresEventProof,
  );

  let trancheAmount = 0;
  const totalTranches = application.totalTranches ?? 0;
  const approvedAmount = application.approvedAmount ?? 0;
  const remainingAmount = approvedAmount - application.totalPaid;

  logger.info(
    `Calculating tranche amount for application ${applicationId}. Total Tranches: ${totalTranches}, Existing Tranches: ${existingTranches}, Approved Amount: ${approvedAmount}, Remaining Amount: ${remainingAmount}, Is First: ${isFirstTranche}`,
  );
  if (totalTranches === 2) {
    if (isFirstTranche) {
      trancheAmount = Math.round(remainingAmount * 0.5);
    } else if (existingTranches === 1) {
      trancheAmount = remainingAmount;
    }
  }

  if (totalTranches === 3) {
    if (isFirstTranche) {
      trancheAmount = Math.round(approvedAmount * 0.3);
    } else if (existingTranches === 1) {
      trancheAmount = Math.round(approvedAmount * 0.3);
    } else if (existingTranches === 2) {
      trancheAmount = remainingAmount;
    }
  }

  if (totalTranches === 4) {
    if (isFirstTranche) {
      trancheAmount = Math.round(approvedAmount * 0.3);
    } else if (existingTranches === 1) {
      trancheAmount = Math.round(approvedAmount * 0.3);
    } else if (existingTranches === 2) {
      trancheAmount = remainingAmount;
    } else if (existingTranches === 3) {
      trancheAmount = remainingAmount;
    }
  }

  if (trancheAmount > remainingAmount) {
    const errorMessage = `Calculated tranche amount (${trancheAmount}) exceeds remaining amount (${remainingAmount}) for application ${applicationId}`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }

  logger.info(
    `Creating tranche ${existingTranches + 1} for application ${applicationId} with amount ${trancheAmount}`,
  );

  const tranche = await prisma.grantTranche.create({
    data: {
      applicationId,
      ask: trancheAmount,
      status: isFirstTranche ? 'Approved' : 'Pending',
      helpWanted,
      update,
      walletAddress,
      grantId: application.grantId,
      trancheNumber: existingTranches + 1,
      ...(isFirstTranche && { approvedAmount: trancheAmount }),
      ...(isFirstTranche && { decidedAt: new Date().toISOString() }),
      ...(normalizedEventPictures && {
        eventPictures: normalizedEventPictures,
      }),
      ...(normalizedEventReceipts && {
        eventReceipts: normalizedEventReceipts,
      }),
      ...(normalizedAttendeeCount !== undefined && {
        attendeeCount: normalizedAttendeeCount,
      }),
      ...(normalizedSocialPost && { socialPost: normalizedSocialPost }),
    },
    include: {
      GrantApplication: {
        include: {
          user: {
            select: {
              username: true,
              kycName: true,
              kycAddress: true,
              kycDOB: true,
              kycIDNumber: true,
              kycIDType: true,
              kycCountry: true,
              email: true,
              location: true,
            },
          },
          grant: true,
        },
      },
    },
  });

  logger.info(
    `Successfully created tranche ${tranche.id} for application ${applicationId}`,
  );

  if (walletAddress) {
    await prisma.grantApplication.update({
      where: { id: applicationId },
      data: { walletAddress },
    });
    logger.info(
      `Updated grant application ${applicationId} with wallet address ${walletAddress}`,
    );
  }

  if (isFirstTranche) {
    const updatedGrantApplication =
      await prisma.grantApplication.findUniqueOrThrow({
        where: { id: applicationId },
        include: {
          grant: true,
          user: {
            select: {
              email: true,
              kycName: true,
            },
          },
        },
      });

    try {
      logger.info(
        `Adding onboarding info to Airtable for application ${applicationId}`,
      );
      await addOnboardingInfoToAirtable(updatedGrantApplication);
      logger.info(
        `Adding payment info to Airtable for tranche ${tranche.id} (application ${applicationId})`,
      );
      await addPaymentInfoToAirtable(tranche.GrantApplication, tranche);
    } catch (airtableError: any) {
      logger.error(
        `Error adding info to Airtable for application ${applicationId} / tranche ${tranche.id}: ${airtableError.message}`,
        { error: airtableError },
      );
    }
  }

  return tranche;
}
