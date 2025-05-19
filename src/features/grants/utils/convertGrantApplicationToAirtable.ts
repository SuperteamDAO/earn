import { type GrantApplication } from '@prisma/client';
import TurndownService from 'turndown';

import { GRANT_APPLICATION_FIELD_IDS } from '@/config/airtableFieldIds.config';

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

// Using Record type for flexibility with field IDs
type GrantApplicationAirtableData = Record<
  string,
  string | string[] | number | undefined
>;

export function convertGrantApplicationToAirtable(
  grantApplication: GrantApplicationWithUserAndGrant,
  applicantSuperteamRegionRecordId?: string | undefined | null,
): GrantApplicationAirtableData {
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
    [GRANT_APPLICATION_FIELD_IDS.EARN_APPLICATION_ID]: grantApplication.id,
    [GRANT_APPLICATION_FIELD_IDS.TITLE]: grantApplication.projectTitle,
    [GRANT_APPLICATION_FIELD_IDS.STATUS]: status,
    [GRANT_APPLICATION_FIELD_IDS.SUMMARY]: grantApplication.projectOneLiner,
    [GRANT_APPLICATION_FIELD_IDS.FUNDING]:
      grantApplication.approvedAmount || grantApplication.ask,
    [GRANT_APPLICATION_FIELD_IDS.KPI]:
      turndownService.turndown(grantApplication.kpi || '') || undefined,
    [GRANT_APPLICATION_FIELD_IDS.PROOF_OF_WORK]: turndownService.turndown(
      grantApplication.proofOfWork,
    ),
    [GRANT_APPLICATION_FIELD_IDS.NAME]: `${grantApplication.user.firstName} ${grantApplication.user.lastName}`,
    [GRANT_APPLICATION_FIELD_IDS.CONTACT_EMAIL]: grantApplication.user.email,
    [GRANT_APPLICATION_FIELD_IDS.TWITTER_URL]:
      grantApplication.twitter || undefined,
    [GRANT_APPLICATION_FIELD_IDS.SOL_WALLET]: grantApplication.walletAddress,
    [GRANT_APPLICATION_FIELD_IDS.MILESTONES]:
      turndownService.turndown(grantApplication.milestones || '') || undefined,
    [GRANT_APPLICATION_FIELD_IDS.GRANTS]: [grantApplication.grant.airtableId!],
    [GRANT_APPLICATION_FIELD_IDS.DESCRIPTION]: turndownService.turndown(
      grantApplication.projectDetails,
    ),
    [GRANT_APPLICATION_FIELD_IDS.DISCORD_HANDLE]:
      grantApplication.user.discord || undefined,
    [GRANT_APPLICATION_FIELD_IDS.DEADLINE]: grantApplication.projectTimeline,
    [GRANT_APPLICATION_FIELD_IDS.TYPE]: 'Earn',
    [GRANT_APPLICATION_FIELD_IDS.GRANT_LISTING_TITLE]:
      grantApplication.grant.title,
    ...(applicantSuperteamRegionRecordId
      ? {
          [GRANT_APPLICATION_FIELD_IDS.REGION_DASHBOARD]: [
            applicantSuperteamRegionRecordId,
          ],
        }
      : {}),
  };
}
