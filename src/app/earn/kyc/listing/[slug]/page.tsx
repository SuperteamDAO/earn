import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import { redirect } from 'next/navigation';

import { Default } from '@/layouts/Default';
import { ResumingPage } from '@/lib/auth/resume-session';
import { pageMetadata } from '@/lib/metadata';
import { signInHref } from '@/lib/safe-next';
import { canResume, getViewer } from '@/lib/session';
import * as ListingKyc from '@/server/listing-kyc';
import { runtime } from '@/server/runtime';

import { KycFrame } from './kyc-frame';

export const metadata = pageMetadata({
  title: 'KYC | Superteam Earn',
  description: 'Verify your identity to receive your listing winnings.',
  noIndex: true,
});

// Sumsub's KYC for a winner the foundation pays. Its own document: the
// proxy lets Sumsub's frame in under /earn/kyc/ only.
export default async function ListingKycPage({
  params,
  searchParams,
}: PageProps<'/earn/kyc/listing/[slug]'>) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  // Framed by the listing page's KYC modal: the content alone.
  const embed = query.embed === '1';
  const here = `/earn/kyc/listing/${slug}/`;
  const listing = `/earn/listing/${slug}/`;
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
  const pending = await runtime.runPromise(
    ListingKyc.ListingKyc.use((listingKyc) =>
      listingKyc.pending(viewer.id, slug),
    ).pipe(
      Effect.map(Option.getOrNull),
      Effect.catchTag('DatabaseError', () => Effect.succeed(null)),
    ),
  );
  // Only while their winning submission waits for KYC.
  if (!pending) redirect(listing);

  if (embed) return <KycFrame slug={slug} listingHref={listing} embed />;

  return (
    <Default>
      <div className="flex w-full justify-center bg-white px-2 py-6 md:py-10">
        <div className="relative w-full max-w-xl overflow-hidden rounded-lg border border-slate-200 pb-6">
          <KycFrame slug={slug} listingHref={listing} embed={false} />
        </div>
      </div>
    </Default>
  );
}
