import axios from 'axios';

import logger from '@/lib/logger';
import { type GrantApplicationModel } from '@/prisma/models/GrantApplication';
import {
  airtableConfig,
  airtableInsert,
  airtableUrl,
  fetchAirtableRecordId,
} from '@/utils/airtable';

interface GrantApplicationWithUserAndGrant extends GrantApplicationModel {
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

function grantApplicationToAirtable(
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
  const applicationId = application.id;
  logger.info(
    `Starting addOnboardingInfoToAirtable for application ${applicationId}`,
  );
  try {
    const apiToken = process.env.AIRTABLE_GRANTS_API_TOKEN;
    const baseId = process.env.AIRTABLE_GRANTS_BASE_ID;
    const recipientsTable = process.env.AIRTABLE_RECIPIENTS_TABLE;
    const applicantsTable = process.env.AIRTABLE_GRANTS_TABLE_NAME;

    if (!apiToken || !baseId || !recipientsTable || !applicantsTable) {
      logger.error(
        'Missing required Airtable environment variables for grants.',
      );
      throw new Error(
        'Airtable configuration is incomplete. Check environment variables.',
      );
    }

    const grantsAirtableConfig = airtableConfig(apiToken);

    const recipientsAirtableURL = airtableUrl(baseId, recipientsTable);
    const applicantsAirtableURL = airtableUrl(baseId, applicantsTable);

    logger.info(
      `Fetching Airtable applicant record ID for application ${applicationId} using earnApplicationId field.`,
    );
    const applicantRecordId = await fetchAirtableRecordId(
      applicantsAirtableURL,
      'earnApplicationId',
      applicationId,
      grantsAirtableConfig,
    );

    if (!applicantRecordId) {
      logger.error(
        `Applicant record not found in Airtable for application ${applicationId} using earnApplicationId.`,
      );
      throw new Error(
        `Applicant record not found in Airtable for application ${applicationId}`,
      );
    }
    logger.info(
      `Found Airtable applicant record ID: ${applicantRecordId} for application ${applicationId}`,
    );

    if (!application.grant.airtableId) {
      logger.error(
        `Grant Airtable ID is missing for application ${applicationId}. Cannot create recipient record linking to grant.`,
      );
      throw new Error(
        `Grant Airtable ID is missing for application ${applicationId}.`,
      );
    }
    const airtableData = grantApplicationToAirtable(
      application,
      applicantRecordId,
    );
    const airtablePayload = airtableInsert([{ fields: airtableData }]);

    logger.info(
      `Posting recipient data to Airtable for application ${applicationId}`,
    );
    const response = await axios.post(
      recipientsAirtableURL,
      JSON.stringify(airtablePayload),
      grantsAirtableConfig,
    );
    logger.info(
      `Successfully added recipient info to Airtable for application ${applicationId}. Response status: ${response.status}`,
    );
    return response.data;
  } catch (error: any) {
    const errorMessage = `Error in addOnboardingInfoToAirtable for application ${applicationId}: ${error.message}`;
    logger.error(errorMessage, {
      error: error.stack || error,
      applicationId: applicationId,
      ...(axios.isAxiosError(error) && {
        axiosResponseStatus: error.response?.status,
        axiosResponseData: error.response?.data,
        axiosRequestUrl: error.config?.url,
        axiosRequestMethod: error.config?.method,
      }),
    });
    throw error;
  }
}
