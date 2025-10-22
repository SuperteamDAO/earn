import { redirect } from 'next/navigation';

interface PageProps {
  readonly params: Promise<{ slug: string }>;
}

export default async function CategoryRedirectPage({ params }: PageProps) {
  const { slug } = await params;
  const titleCaseSlug = slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  redirect(`/?category=${titleCaseSlug}&grantCategory=${titleCaseSlug}`);
}
