import { permanentRedirect } from 'next/navigation';

// Old sponsor links: the sponsor's page lives at /earn/s/<slug>/.
export default async function SponsorSlugPage({
  params,
}: PageProps<'/earn/sponsor/[slug]'>) {
  const { slug } = await params;
  permanentRedirect(`/earn/s/${encodeURIComponent(slug)}/`);
}
