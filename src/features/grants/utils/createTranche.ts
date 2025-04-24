import { prisma } from '@/prisma';

import { addOnboardingInfoToAirtable } from './addOnboardingInfoToAirtable';
import { addPaymentInfoToAirtable } from './addPaymentInfoToAirtable';

type CreateTrancheProps = {
  applicationId: string;
  helpWanted?: string;
  update?: string;
  isFirstTranche?: boolean;
};

export async function createTranche({
  applicationId,
  helpWanted,
  update,
  isFirstTranche,
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
    throw new Error('User is not verified');
  }

  const existingTranches = application.GrantTranche.filter(
    (tranche) => tranche.status !== 'Rejected',
  ).length;
  const maxTranches = 4;

  if (existingTranches >= maxTranches) {
    throw new Error('All tranches have already been created');
  }

  if (isFirstTranche && existingTranches > 0) {
    const cutoff = new Date('2025-04-17');
    const allExistingCreatedAt = application.GrantTranche.every(
      (tranche) => new Date(tranche.createdAt) < cutoff,
    );

    if (allExistingCreatedAt) {
      return null;
    }

    throw new Error('Cannot create first tranche when tranches already exist');
  }

  if (!isFirstTranche && existingTranches === 0) {
    throw new Error('Cannot create tranche when no tranches exist');
  }

  if (existingTranches > 0) {
    const previousTranche = application.GrantTranche[existingTranches - 1];
    if (
      previousTranche &&
      previousTranche.status !== 'Paid' &&
      previousTranche.status !== 'Rejected'
    ) {
      throw new Error(
        'Previous tranche must be paid before requesting a new tranche',
      );
    }
  }

  let trancheAmount = 0;
  const totalTranches = application.totalTranches ?? 0;
  const approvedAmount = application.approvedAmount ?? 0;
  const remainingAmount = approvedAmount - application.totalPaid;

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
    throw new Error('Tranche amount exceeds remaining amount');
  }

  const tranche = await prisma.grantTranche.create({
    data: {
      applicationId,
      ask: trancheAmount,
      status: isFirstTranche ? 'Approved' : 'Pending',
      helpWanted,
      update,
      grantId: application.grantId,
      trancheNumber: existingTranches + 1,
      ...(isFirstTranche && { approvedAmount: trancheAmount }),
      ...(isFirstTranche && { decidedAt: new Date().toISOString() }),
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
      await addOnboardingInfoToAirtable(updatedGrantApplication);
      await addPaymentInfoToAirtable(tranche.GrantApplication, tranche);
    } catch (airtableError: any) {
      console.error(
        `Error adding onboarding info to Airtable: ${airtableError.message}`,
      );
    }
  }

  return tranche;
}
