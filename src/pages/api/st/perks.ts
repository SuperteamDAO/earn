import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const result = await axios(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_PERKS_TABLE}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_API_TOKEN}`,
        },
      },
    );

    const records = result?.data?.records ?? [];

    // Filter by status
    const liveNow = records.filter(
      (item: any) => item.fields['Status'] === 'Live Now',
    );
    const completed = records.filter(
      (item: any) => item.fields['Status'] === 'Completed',
    );
    const comingSoon = records.filter(
      (item: any) => item.fields['Status'] === 'Coming Soon',
    );

    res.status(200).json({
      liveNow,
      completed,
      comingSoon,
    });
  } catch (error) {
    console.error('Error fetching perks:', error);
    res.status(500).json({ liveNow: [], completed: [], comingSoon: [] });
  }
}
