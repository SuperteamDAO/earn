import type { NextApiRequest, NextApiResponse } from 'next';

import { getChapterRegions } from '@/utils/chapterRegion';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<string[] | { error: string }>,
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const chapters = await getChapterRegions();
    const countries = Array.from(
      new Set(chapters.map((chapter) => chapter.displayValue)),
    ).sort();

    return res.status(200).json(countries);
  } catch (error) {
    console.error('Error fetching countries:', error);
    return res.status(500).json({ error: 'Failed to fetch countries' });
  }
}
