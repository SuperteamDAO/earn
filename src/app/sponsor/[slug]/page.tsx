import { notFound, redirect } from 'next/navigation';

interface PageProps {
  readonly params: Promise<{ slug?: string }>;
}

export default async function SponsorListingsRedirectPage({
  params,
}: PageProps) {
  const { slug } = await params;

  if (!slug) {
    notFound();
  }

  redirect(`/${slug}`);
}
