import { type GrantApplication } from '@prisma/client';
import axios from 'axios';

import { airtableConfig, airtableUpsert, airtableUrl } from '@/utils/airtable';

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
    publicKey: string | null;
  };
}

export async function handleAirtableSync(
  application: GrantApplicationWithUserAndGrant,
) {
  const config = airtableConfig(process.env.AIRTABLE_GRANTS_API_TOKEN!);
  const url = airtableUrl(
    process.env.AIRTABLE_GRANTS_BASE_ID!,
    process.env.AIRTABLE_GRANTS_TABLE_NAME!,
  );

  const airtableData = convertGrantApplicationToAirtable(application);
  const airtablePayload = airtableUpsert('earnApplicationId', [
    { fields: airtableData },
  ]);

  await axios.patch(url, JSON.stringify(airtablePayload), config);
}
