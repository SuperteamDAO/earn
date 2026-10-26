import { redirect } from 'next/navigation';

import { Default } from '@/layouts/Default';
import { ResumingPage } from '@/lib/auth/resume-session';
import { pageMetadata } from '@/lib/metadata';
import { signInHref } from '@/lib/safe-next';
import { canResume, getViewer } from '@/lib/session';

import { CreateSponsorForm } from '@/features/sponsor/components/CreateSponsorForm';
import { EmbeddedSignIn } from '@/features/sponsor/components/EmbeddedSignIn';

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
    // Earn's panel, with its sign-in form in place.
    return (
      <Default>
        <div className="min-h-screen w-full bg-white">
          <div className="mx-auto flex min-h-[60vh] max-w-[32rem] flex-col items-center justify-center">
            <p className="pt-4 text-center text-2xl font-semibold text-slate-900">
              You&apos;re one step away
            </p>
            <p className="pb-4 text-center text-xl font-normal text-slate-600">
              from joining Superteam Earn
            </p>
            <EmbeddedSignIn next={HERE} />
          </div>
        </div>
      </Default>
    );
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
