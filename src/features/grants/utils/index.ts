import { type GrantApplication } from '@prisma/client';

import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';

export function grantAmount({
  minReward,
  maxReward,
}: {
  minReward: number;
  maxReward: number;
}) {
  if (minReward && maxReward && minReward > 0) {
    return `${formatNumberWithSuffix(minReward)}-${formatNumberWithSuffix(maxReward)}`;
  } else {
    return `Upto ${formatNumberWithSuffix(maxReward!)}`;
  }
}

interface GrantApplicationWithUserAndGrant extends GrantApplication {
  grant: {
    airtableId: string | null;
  };
  user: {
    firstName: string | null;
    lastName: string | null;
    email: string;
    discord: string | null;
    twitter: string | null;
  };
}

interface GrantApplicationAirtableSchema {
  earnApplicationId: string;
  Title: string;
  Status: string;
  Summary: string;
  Funding: number;
  KPI: string | undefined;
  'Proof of Work': string;
  Name: string;
  'Contact Email': string;
  'Twitter URL': string | undefined;
  'SOL Wallet': string;
  Milestones: string | undefined;
  Grants: string[];
  Description: string;
  'Discord Handle': string | undefined;
  Deadline: string;
}

export function convertGrantApplicationToAirtable(
  grantApplication: GrantApplicationWithUserAndGrant,
): GrantApplicationAirtableSchema {
  let status;
  switch (grantApplication.applicationStatus) {
    case 'Pending':
      status = 'Undecided';
      break;
    case 'Approved':
      status = 'Accepted';
      break;
    case 'Rejected':
      status = 'Rejected';
      break;
    default:
      status = grantApplication.applicationStatus;
  }
  return {
    earnApplicationId: grantApplication.id,
    Title: grantApplication.projectTitle,
    Status: status,
    Summary: grantApplication.projectOneLiner,
    Funding: grantApplication.approvedAmount || grantApplication.ask,
    KPI: grantApplication.kpi ?? undefined,
    'Proof of Work': grantApplication.proofOfWork,
    Name: `${grantApplication.user.firstName} ${grantApplication.user.lastName}`,
    'Contact Email': grantApplication.user.email,
    'Twitter URL': grantApplication.user.twitter ?? undefined,
    'SOL Wallet': grantApplication.walletAddress,
    Milestones: grantApplication.milestones ?? undefined,
    Grants: [grantApplication.grant.airtableId!],
    Description: grantApplication.projectDetails,
    'Discord Handle': grantApplication.user.discord ?? undefined,
    Deadline: grantApplication.projectTimeline,
  };
}
