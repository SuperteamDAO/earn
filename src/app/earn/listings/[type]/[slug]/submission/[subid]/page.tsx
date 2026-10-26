import { permanentRedirect } from 'next/navigation';

// A submission's old page is its feed post now.
export default async function LegacySubmissionPage({
  params,
}: PageProps<'/earn/listings/[type]/[slug]/submission/[subid]'>) {
  const { subid } = await params;
  permanentRedirect(`/earn/feed/submission/${subid}/`);
}
