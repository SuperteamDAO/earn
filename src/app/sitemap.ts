import type { MetadataRoute } from 'next';

import { runtime } from '@/server/runtime';
import * as Sitemaps from '@/server/sitemaps';

export const revalidate = 86400; // 1 day

// /sitemap/<id>.xml: static pages, listings, sponsors, grants, talent,
// categories and regions, 50,000 URLs to a file.
export async function generateSitemaps() {
  return [
    ...(await runtime.runPromise(
      Sitemaps.Sitemaps.use((sitemaps) => sitemaps.ids),
    )),
  ];
}

export default async function sitemap(props: {
  id: Promise<string>;
}): Promise<MetadataRoute.Sitemap> {
  const id = await props.id;
  return runtime.runPromise(
    Sitemaps.Sitemaps.use((sitemaps) => sitemaps.entries(id)),
  );
}
