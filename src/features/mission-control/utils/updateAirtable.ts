import { PromiserJson } from '@/utils/promiser';

interface UpdateAirtableProps {
  baseId: string;
  tableId: string;
  recordId: string;
  fields: Record<string, any>;
  token: string;
}

interface AirtableResponse {
  records: any[];
}

export async function updateAirtable({
  baseId,
  tableId,
  recordId,
  fields,
  token,
}: UpdateAirtableProps) {
  const airtableAPIUrl = `https://api.airtable.com/v0`;
  const updateUrl = `${airtableAPIUrl}/${baseId}/${tableId}/${recordId}`;

  console.log('fields - ', fields);
  const updateReq = fetch(updateUrl, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields }),
  });

  const [parsedData, updateError] =
    await PromiserJson<AirtableResponse>(updateReq);

  if (updateError) {
    console.error(updateError.error);
    throw new Error(
      updateError.message ?? `Something went wrong while updating Airtable`,
    );
  }

  return parsedData;
}
