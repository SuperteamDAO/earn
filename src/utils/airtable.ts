function airtableUrl(baseId: string, tableName: string) {
  if (!baseId || !tableName)
    throw new Error('AIRTABLE BASE ID OR TABLE NAME NOT PROVIDED');

  return `https://api.airtable.com/v0/${baseId}/${tableName}`;
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

function airtableUpsert(mergeOn: string, data: any[]) {
  return {
    performUpsert: {
      fieldsToMergeOn: [mergeOn],
    },
    records: data,
  };
}

export { airtableConfig, airtableUpsert, airtableUrl };
