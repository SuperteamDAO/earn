import { redirect } from 'next/navigation';

import { Default } from '@/layouts/Default';
import { ResumingPage } from '@/lib/auth/resume-session';
import { pageMetadata } from '@/lib/metadata';
import { signInHref } from '@/lib/safe-next';
import { canResume, getViewer } from '@/lib/session';

import { applicationStateOf } from '@/features/grants/hooks/useApplicationState';

import { grantBySlug, grantPageData } from '../grant-data';
import { KycFrame } from './kyc-frame';

export const metadata = pageMetadata({
  title: 'KYC | Superteam Earn',
  description: 'Verify your identity to receive your grant.',
  noIndex: true,
});

// Sumsub's KYC for an approved grantee (Earn's KYC modal on the grant
// page). Its own document: the proxy lets Sumsub's frame in only here.
export default async function GrantKycPage({
  params,
}: PageProps<'/earn/grants/[slug]/kyc'>) {
  const { slug } = await params;
  const here = `/earn/grants/${slug}/kyc/`;
  const grantHref = `/earn/grants/${slug}/`;
  const viewer = await getViewer();
  if (!viewer) {
    if (await canResume()) {
      return (
        <Default>
          <ResumingPage signIn={signInHref(here)} />
        </Default>
      );
    }
    redirect(signInHref(here));
  }
  const grant = await grantBySlug(slug);
  if (!grant) redirect(grantHref);
  const { application } = await grantPageData(grant);
  // Only while the grant page's button says "Submit KYC".
  if (
    !application ||
    applicationStateOf(application, grant) !== 'KYC PENDING'
  ) {
    redirect(grantHref);
  }

  return (
    <Default>
      <div className="flex w-full justify-center bg-white px-2 py-6 md:py-10">
        <div className="relative w-full max-w-xl overflow-hidden rounded-lg border border-slate-200">
          <KycFrame
            slug={slug}
            applicationId={application.id}
            grantHref={grantHref}
          />
        </div>
      </div>
    </Default>
  );
}
