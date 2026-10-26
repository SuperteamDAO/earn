import { permanentRedirect } from 'next/navigation';

export default async function LegacySubmissionsPage({
  params,
}: PageProps<'/earn/listings/[type]/[slug]/submission'>) {
  const { slug } = await params;
  permanentRedirect(`/earn/listing/${slug}/submission/`);
}
