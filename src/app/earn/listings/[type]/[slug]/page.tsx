import { permanentRedirect } from 'next/navigation';

// Earn's old listing URLs (/earn/listings/bounties/…, /earn/listings/<type>/…).
export default async function LegacyListingPage({
  params,
}: PageProps<'/earn/listings/[type]/[slug]'>) {
  const { type, slug } = await params;
  if (type === 'grants') permanentRedirect(`/earn/grants/${slug}/`);
  permanentRedirect(`/earn/listing/${slug}/`);
}
