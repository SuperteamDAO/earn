import { prisma } from '@/prisma';

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
    },
  });

  const existingTranches = application.GrantTranche.length;
  const maxTranches = application.approvedAmount > 5000 ? 3 : 2;

  if (existingTranches >= maxTranches) {
    throw new Error('All tranches have already been created');
  }

  if (isFirstTranche && existingTranches > 0) {
    throw new Error('Cannot create first tranche when tranches already exist');
  }

  if (!isFirstTranche && existingTranches === 0) {
    throw new Error('Cannot create tranche when no tranches exist');
  }

  if (existingTranches > 0) {
    const previousTranche = application.GrantTranche[existingTranches - 1];
    if (previousTranche && previousTranche.status !== 'Paid') {
      throw new Error(
        'Previous tranche must be paid before requesting a new tranche',
      );
    }
  }

  let trancheAmount;
  if (application.approvedAmount <= 5000) {
    trancheAmount = application.approvedAmount * 0.5;
  } else {
    if (isFirstTranche || existingTranches === 0) {
      trancheAmount = application.approvedAmount * 0.3;
    } else if (existingTranches === 1) {
      trancheAmount = application.approvedAmount * 0.3;
    } else {
      trancheAmount = application.approvedAmount * 0.4;
    }
  }

  const tranche = await prisma.grantTranche.create({
    data: {
      applicationId,
      ask: trancheAmount,
      status: isFirstTranche ? 'Approved' : 'Pending',
      helpWanted,
      update,
      grantId: application.grantId,
    },
  });

  return tranche;
}
