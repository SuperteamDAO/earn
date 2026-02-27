import type { NextApiRequest, NextApiResponse } from 'next';

import { getChapterRegions } from '@/utils/chapterRegion';

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const chapterRegions = await getChapterRegions();
    const chapters = chapterRegions.map((chapter) => ({
      name: chapter.name,
      region: chapter.region,
      displayValue: chapter.displayValue,
      slug: chapter.slug,
      code: chapter.code,
      country: chapter.country,
      icons: chapter.icons || undefined,
      banner: chapter.banner || undefined,
      link: chapter.link || undefined,
      hello: chapter.hello || undefined,
      nationality: chapter.nationality || undefined,
    }));

    return res.status(200).json({ chapters });
  } catch (error) {
    console.error('Error fetching chapters:', error);
    return res.status(500).json({ error: 'Failed to fetch chapters' });
  }
}
