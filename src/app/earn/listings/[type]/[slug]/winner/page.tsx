import { permanentRedirect } from 'next/navigation';

export default async function LegacyWinnerPage({
  params,
}: PageProps<'/earn/listings/[type]/[slug]/winner'>) {
  const { slug } = await params;
  permanentRedirect(`/earn/listing/${slug}/winner/`);
}
