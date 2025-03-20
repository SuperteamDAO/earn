import { type GrantApplication } from '@prisma/client';
import axios from 'axios';

import {
  airtableConfig,
  airtableInsert,
  airtableUrl,
  fetchAirtableRecordId,
} from '@/utils/airtable';

interface GrantApplicationWithUserAndGrant extends GrantApplication {
  grant: {
    airtableId: string | null;
  };
  user: {
    email: string;
    kycName: string | null;
  };
}

interface RecipientAirtableSchema {
  Name: string;
  Applicants: string[];
  Grant: string[];
  'Email ID': string;
  Amount: number;
  Deadline: string;
}

export function grantApplicationToAirtable(
  grantApplication: GrantApplicationWithUserAndGrant,
  applicantRecordId: string,
): RecipientAirtableSchema {
  return {
    Name: `${grantApplication.user.kycName}`,
    Applicants: [applicantRecordId],
    Grant: [grantApplication.grant.airtableId!],
    'Email ID': grantApplication.user.email,
    Amount: grantApplication.approvedAmount,
    Deadline: grantApplication.projectTimeline,
  };
}

export async function addOnboardingInfoToAirtable(
  application: GrantApplicationWithUserAndGrant,
) {
  try {
    const grantsAirtableConfig = airtableConfig(
      process.env.AIRTABLE_GRANTS_API_TOKEN!,
    );

    const recipientsAirtableURL = airtableUrl(
      process.env.AIRTABLE_GRANTS_BASE_ID!,
      process.env.AIRTABLE_RECIPIENTS_TABLE!,
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

    const airtableData = grantApplicationToAirtable(
      application,
      applicantRecordId,
    );

    const airtablePayload = airtableInsert([{ fields: airtableData }]);
    const response = await axios.post(
      recipientsAirtableURL,
      JSON.stringify(airtablePayload),
      grantsAirtableConfig,
    );
    return response.data;
  } catch (error: any) {
    console.error(`Error in addOnboardingInfoToAirtable: ${error.message}`);
    throw error;
  }
}
