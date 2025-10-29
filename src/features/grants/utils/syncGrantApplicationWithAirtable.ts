import axios from 'axios';

import { Superteams } from '@/constants/Superteam';
import logger from '@/lib/logger';
import { type GrantApplicationModel } from '@/prisma/models/GrantApplication';
import {
  airtableConfig,
  airtableUpsert,
  airtableUrl,
  fetchAirtableRecordId,
} from '@/utils/airtable';

import { convertGrantApplicationToAirtable } from './convertGrantApplicationToAirtable';

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
    location: string | null;
  };
}

export async function syncGrantApplicationWithAirtable(
  application: GrantApplicationWithUserAndGrant,
) {
  const { id: applicationId, user } = application;
  logger.info(
    `Starting syncGrantApplicationWithAirtable for Application ID: ${applicationId}`,
  );

  const grantsAirtableConfig = airtableConfig(
    process.env.AIRTABLE_GRANTS_API_TOKEN!,
  );
  const grantsAirtableURL = airtableUrl(
    process.env.AIRTABLE_GRANTS_BASE_ID!,
    process.env.AIRTABLE_GRANTS_TABLE_NAME!,
  );

  const grantsRegionAirtableURL = airtableUrl(
    process.env.AIRTABLE_GRANTS_BASE_ID!,
    process.env.AIRTABLE_GRANTS_REGIONS_TABLE_NAME!,
  );

  const superteam = Superteams.find(
    (s) =>
      s.country.some(
        (c) => c.toLowerCase() === application.user.location?.toLowerCase(),
      ) || s.region === application.user.location,
  );

  const regionName = superteam ? superteam.region : 'Global';

  logger.info(
    {
      applicationId,
      userLocation: user.location,
      foundSuperteam: superteam?.displayValue,
      determinedRegionName: regionName,
    },
    `Superteam lookup result for Application ID: ${applicationId}. Region: ${regionName}`,
  );
  logger.info(
    { applicationId, regionName },
    `Fetching Airtable region ID for Application ID: ${applicationId}, Region Name: ${regionName}`,
  );
  const region = await fetchAirtableRecordId(
    grantsRegionAirtableURL,
    'Name',
    superteam ? superteam.region : 'Global',
    grantsAirtableConfig,
  );
  logger.info(
    { applicationId, regionName, regionId: region },
    `Fetched Airtable region ID for Application ID: ${applicationId}. Region ID: ${region}`,
  );

  const airtableData = convertGrantApplicationToAirtable(application, region);
  logger.info(
    { applicationId },
    `Converted application data for Airtable for Application ID: ${applicationId}`,
  );

  const airtablePayload = airtableUpsert('earnApplicationId', [
    { fields: airtableData },
  ]);

  logger.info(
    { applicationId, url: grantsAirtableURL },
    `Attempting Airtable upsert for Application ID: ${applicationId}`,
  );
  try {
    await axios.patch(
      grantsAirtableURL,
      JSON.stringify(airtablePayload),
      grantsAirtableConfig,
    );
    logger.info(
      { applicationId },
      `Successfully synced Application ID: ${applicationId} with Airtable`,
    );
  } catch (error: any) {
    console.error('Failed to sync grant application with Airtable:', {
      applicationId,
      error: error?.response?.data || error?.message || error,
      errorStatus: error?.response?.status,
      errorResponse: error?.response?.data,
    });
    logger.error('Failed to sync grant application with Airtable:', {
      applicationId,
      error: error?.response?.data || error?.message || error,
      errorStatus: error?.response?.status,
      errorResponse: error?.response?.data,
    });
    throw error;
  }
}
