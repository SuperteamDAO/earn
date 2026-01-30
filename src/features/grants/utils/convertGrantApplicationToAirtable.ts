import TurndownService from 'turndown';

import { type GrantApplicationModel } from '@/prisma/models/GrantApplication';

interface GrantApplicationWithUserAndGrant extends GrantApplicationModel {
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

function getValidDeadline(projectTimeline: string, createdAt: Date): string {
  const timelineDate = new Date(projectTimeline);
  if (!isNaN(timelineDate.getTime())) {
    return projectTimeline;
  }

  const fallbackDate = new Date(createdAt);
  fallbackDate.setDate(fallbackDate.getDate() + 10);

  const day = fallbackDate.getDate();
  const month = fallbackDate.toLocaleString('en-US', { month: 'long' });
  const year = fallbackDate.getFullYear();

  return `${day} ${month} ${year}`;
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
  Type: string;
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
    Deadline: getValidDeadline(
      grantApplication.projectTimeline,
      grantApplication.createdAt,
    ),
    Type: 'Earn',
    'Grant Listing Title (Earn)': grantApplication.grant.title,
    ...(applicantSuperteamRegionRecordId
      ? {
          'Region (Dashboard)': [applicantSuperteamRegionRecordId],
        }
      : {}),
  };
}
