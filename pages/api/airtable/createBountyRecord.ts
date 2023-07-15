import type { NextApiRequest, NextApiResponse } from 'next';

import { getDatabase } from '@/utils/airtable';

export default async function createBountyRecord(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { name, description, bounty, email } = req.body;
  const base = getDatabase();
  const table = base(process.env.AIRTABLE_BOUNTY_TABLE!);

  try {
    const records = await table.create([
      {
        fields: {
          Name: name,
          Description: description,
          Bounty: bounty,
          Email: email,
        },
      },
    ]);
    res.status(200).json(records);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Something went wrong.' });
  }
}
