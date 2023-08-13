import Airtable from 'airtable';

export function getDatabase() {
  return new Airtable({ apiKey: process.env.AIRTABLE_KEY }).base(
    process.env.AIRTABLE_BOUNTY_BASE!
  );
}
