import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const result = await axios(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_PROJECTS_TABLE}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_API_TOKEN}`,
        },
      },
    );

    const filtered = result?.data?.records.filter(
      (item: any) => item.fields['Rank'] && item.fields['Country'],
    );

    res.status(200).json({ projects: filtered ?? [] });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ projects: [] });
  }
}
