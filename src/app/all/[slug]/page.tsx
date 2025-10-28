import { redirect } from 'next/navigation';

interface PageProps {
  readonly params: Promise<{ slug: string }>;
}

export default async function CategoryRedirectPage({ params }: PageProps) {
  const { slug } = await params;
  redirect(`/category/${slug}/`);
}
