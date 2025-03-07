import { type GrantTranche } from '@prisma/client';
import axios from 'axios';

import {
  airtableConfig,
  airtableUpsert,
  airtableUrl,
  fetchAirtableRecordId,
} from '@/utils/airtable';

interface TrancheAirtableSchema {
  earnApplicationId: string;
  Project: string[];
  Amount: number;
  Update: string;
  'Help Wanted': string;
}

interface GrantTrancheWithUserAndGrant extends GrantTranche {
  grant: {
    airtableId: string | null;
  };
  user: {
    email: string;
  };
}

export function grantTrancheToAirtable(
  grantTranche: GrantTrancheWithUserAndGrant,
  applicantRecordId: string,
): TrancheAirtableSchema {
  return {
    earnApplicationId: grantTranche.applicationId,
    Project: [applicantRecordId],
    Amount: grantTranche.approvedAmount || 0,
    Update: grantTranche.update || '',
    'Help Wanted': grantTranche.helpWanted || '',
  };
}

export async function addTrancheInfoToAirtable(
  application: GrantTrancheWithUserAndGrant,
) {
  const grantsAirtableConfig = airtableConfig(
    process.env.AIRTABLE_GRANTS_API_TOKEN!,
  );
  const tranchesAirtableURL = airtableUrl(
    process.env.AIRTABLE_GRANTS_BASE_ID!,
    process.env.AIRTABLE_TRANCHES_TABLE_NAME!,
  );

  const applicantsAirtableURL = airtableUrl(
    process.env.AIRTABLE_GRANTS_BASE_ID!,
    process.env.AIRTABLE_GRANTS_TABLE_NAME!,
  );

  const applicantRecordId = await fetchAirtableRecordId(
    applicantsAirtableURL,
    'earnApplicationId',
    application.id,
    grantsAirtableConfig,
  );

  if (!applicantRecordId) {
    throw new Error('Applicant record not found');
  }

  const airtableData = grantTrancheToAirtable(application, applicantRecordId);
  const airtablePayload = airtableUpsert('earnApplicationId', [
    { fields: airtableData },
  ]);

  await axios.patch(
    tranchesAirtableURL,
    JSON.stringify(airtablePayload),
    grantsAirtableConfig,
  );
}
