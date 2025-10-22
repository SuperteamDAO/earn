import { redirect } from 'next/navigation';

interface PageProps {
  readonly params: Promise<{ slug: string }>;
}

export default async function BountySubmissionRedirectPage({
  params,
}: PageProps) {
  const { slug } = await params;
  redirect(`/listing/${slug}/submission`);
}
