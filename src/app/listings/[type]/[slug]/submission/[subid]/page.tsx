import { redirect } from 'next/navigation';

interface PageProps {
  readonly params: Promise<{ subid: string }>;
}

export default async function SubmissionRedirectPage({ params }: PageProps) {
  const { subid } = await params;
  redirect(`/feed/submission/${subid}/`);
}
