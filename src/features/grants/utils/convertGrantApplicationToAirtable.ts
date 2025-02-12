import { type GrantApplication } from '@prisma/client';
import TurndownService from 'turndown';

interface GrantApplicationWithUserAndGrant extends GrantApplication {
  grant: {
    airtableId: string | null;
    title: string;
  };
  user: {
    firstName: string | null;
    lastName: string | null;
    email: string;
    discord: string | null;
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
  'Grant Listing Title (Earn)': string;
  'Region (Dashboard)'?: string[];
}

export function convertGrantApplicationToAirtable(
  grantApplication: GrantApplicationWithUserAndGrant,
  applicantSuperteamRegionRecordId?: string | undefined | null,
): GrantApplicationAirtableSchema {
  let status;
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    bulletListMarker: '-',
  });
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
    KPI: turndownService.turndown(grantApplication.kpi || '') ?? undefined,
    'Proof of Work': turndownService.turndown(grantApplication.proofOfWork),
    Name: `${grantApplication.user.firstName} ${grantApplication.user.lastName}`,
    'Contact Email': grantApplication.user.email,
    'Twitter URL': grantApplication.twitter ?? undefined,
    'SOL Wallet': grantApplication.walletAddress,
    Milestones:
      turndownService.turndown(grantApplication.milestones || '') ?? undefined,
    Grants: [grantApplication.grant.airtableId!],
    Description: turndownService.turndown(grantApplication.projectDetails),
    'Discord Handle': grantApplication.user.discord ?? undefined,
    Deadline: grantApplication.projectTimeline,
    'Grant Listing Title (Earn)': grantApplication.grant.title,
    ...(applicantSuperteamRegionRecordId
      ? {
          'Region (Dashboard)': [applicantSuperteamRegionRecordId],
        }
      : {}),
  };
}
