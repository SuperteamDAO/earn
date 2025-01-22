import { type GrantApplication } from '@prisma/client';
import axios from 'axios';

import { Superteams } from '@/constants/Superteam';
import {
  airtableConfig,
  airtableUpsert,
  airtableUrl,
  fetchAirtableRecordId,
} from '@/utils/airtable';

import { convertGrantApplicationToAirtable } from './convertGrantApplicationToAirtable';

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
    location: string | null;
  };
}

export async function handleAirtableSync(
  application: GrantApplicationWithUserAndGrant,
) {
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

  const region = await fetchAirtableRecordId(
    grantsRegionAirtableURL,
    'Name',
    superteam ? superteam.airtableKey || superteam.displayValue : 'Global',
    grantsAirtableConfig,
  );

  const airtableData = convertGrantApplicationToAirtable(application, region);
  const airtablePayload = airtableUpsert('earnApplicationId', [
    { fields: airtableData },
  ]);

  await axios.patch(
    grantsAirtableURL,
    JSON.stringify(airtablePayload),
    grantsAirtableConfig,
  );
}
