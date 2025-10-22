import { redirect } from 'next/navigation';

interface PageProps {
  readonly params: Promise<{ slug: string }>;
}

export default async function GrantRedirectPage({ params }: PageProps) {
  const { slug } = await params;
  redirect(`/grants/${slug}/`);
}
