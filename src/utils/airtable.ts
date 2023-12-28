import Airtable from 'airtable';

function getDatabase() {
  const base = new Airtable({ apiKey: process.env.AIRTABLE_KEY }).base(
    process.env.AIRTABLE_BASE!
  );
  const table = base(process.env.AIRTABLE_TABLE!);
  return table;
}

export async function getUnsubEmails(): Promise<string[]> {
  const table = getDatabase();
  try {
    const records = await table.select().all();
    const emails = records
      .map((record) => record.fields.Email as string)
      .filter(Boolean);
    return emails;
  } catch (error) {
    console.error(error);
    return [];
  }
}
