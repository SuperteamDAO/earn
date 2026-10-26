import { redirect } from 'next/navigation';

import { Default } from '@/layouts/Default';
import { ResumingPage } from '@/lib/auth/resume-session';
import { pageMetadata } from '@/lib/metadata';
import { signInHref } from '@/lib/safe-next';
import { canResume, getViewer } from '@/lib/session';

import { CreateSponsorForm } from '@/features/sponsor/components/CreateSponsorForm';

const HERE = '/earn/new/sponsor/';

export const metadata = pageMetadata({
  title: 'Create Sponsor | Superteam Earn',
  description: 'Every Solana opportunity in one place!',
  canonical: 'https://superteam.fun/earn/new/sponsor/',
});

export default async function NewSponsorPage() {
  const viewer = await getViewer();
  if (!viewer) {
    if (await canResume()) {
      return (
        <Default>
          <ResumingPage signIn={signInHref(HERE)} />
        </Default>
      );
    }
    redirect(signInHref(HERE));
  }
  // One sponsor each; God mode may make more.
  if (viewer.currentSponsorId && viewer.role !== 'GOD') {
    redirect('/earn/dashboard/listings/?open=1');
  }
  return (
    <Default>
      <CreateSponsorForm />
    </Default>
  );
}
