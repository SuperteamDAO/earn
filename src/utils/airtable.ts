import axios, { AxiosError } from 'axios';

function airtableUrl(baseId: string, tableName: string, recordId?: string) {
  if (!baseId || !tableName)
    throw new Error('AIRTABLE BASE ID OR TABLE NAME NOT PROVIDED');

  let url = `https://api.airtable.com/v0/${baseId}/${tableName}`;
  if (recordId) url += `/${recordId}`;

  return url;
}

function airtableConfig(apiToken: string) {
  if (!apiToken) throw new Error('AIRTABLE API TOKEN NOT PROVIDED');
  return {
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
  };
}

function airtableInsert(data: any[], typecast?: boolean) {
  return {
    records: data,
    ...(typecast ? { typecast: true } : {}),
  };
}

function airtableUpsert(mergeOn: string, data: any[]) {
  return {
    performUpsert: {
      fieldsToMergeOn: [mergeOn],
    },
    records: data,
  };
}

interface AirtableRecord {
  id: string;
  fields: Record<string, any>;
}

interface AirtableResponse {
  records: AirtableRecord[];
}

async function fetchAirtableRecordId(
  url: string,
  fieldName: string | null,
  fieldValue: string | null,
  config: ReturnType<typeof airtableConfig>,
  filterFormula?: string,
): Promise<string | null | undefined> {
  try {
    const formula =
      filterFormula ||
      (fieldName && fieldValue
        ? `{${fieldName}} = '${fieldValue}'`
        : undefined);

    if (!formula) {
      throw new Error(
        'fetchAirtableRecordId requires either a filterFormula or both fieldName and fieldValue.',
      );
    }

    const response = await axios.get<AirtableResponse>(url, {
      ...config,
      params: {
        filterByFormula: formula,
        maxRecords: 1,
      },
    });

    if (response.data.records.length > 0) {
      return response.data.records[0]?.id;
    } else {
      return null;
    }
  } catch (error) {
    if (error instanceof AxiosError) {
      console.error(
        'Error fetching Airtable record:',
        error.response?.data || error.message,
      );
    } else {
      console.error('Error fetching Airtable record:', error);
    }
    throw error;
  }
}

export {
  airtableConfig,
  airtableInsert,
  airtableUpsert,
  airtableUrl,
  fetchAirtableRecordId,
};
