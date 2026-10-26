import { notFound, permanentRedirect } from 'next/navigation';

import { exclusiveSponsorData } from '@/constants/exclusiveSponsors';
import { runtime } from '@/server/runtime';
import * as SponsorPages from '@/server/sponsor-pages';

// Old exclusive-sponsor links (/earn/<name>/) to the sponsor's page.
export default async function SponsorListingsPage({
  params,
}: PageProps<'/earn/[sponsor]'>) {
  const exclusive = exclusiveSponsorData[(await params).sponsor];
  if (!exclusive) notFound();
  const slug = await runtime.runPromise(
    SponsorPages.SponsorPages.use((pages) => pages.slugByName(exclusive.title)),
  );
  if (!slug) notFound();
  permanentRedirect(`/earn/s/${slug}/`);
}
