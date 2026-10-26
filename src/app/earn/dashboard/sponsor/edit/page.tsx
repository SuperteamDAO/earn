import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import { redirect } from 'next/navigation';

import { SponsorLayout } from '@/layouts/Sponsor';
import { ResumingPage } from '@/lib/auth/resume-session';
import { pageMetadata } from '@/lib/metadata';
import { signInHref } from '@/lib/safe-next';
import { canResume, getViewer } from '@/lib/session';
import { runtime } from '@/server/runtime';
import * as SponsorAccounts from '@/server/sponsor-accounts';

import { EditSponsorForm } from '@/features/sponsor/components/EditSponsorForm';

const HERE = '/earn/dashboard/sponsor/edit/';

export const metadata = pageMetadata({
  title: 'Superteam Earn | Work to Earn in Crypto',
  description:
    'Explore the latest bounties on Superteam Earn, offering opportunities in the crypto space across Design, Development, and Content.',
  noIndex: true,
});

export default async function EditSponsorPage() {
  const viewer = await getViewer();
  if (!viewer) {
    if (await canResume()) {
      return (
        <SponsorLayout>
          <ResumingPage signIn={signInHref(HERE)} />
        </SponsorLayout>
      );
    }
    redirect(signInHref(HERE));
  }
  const sponsor = await runtime.runPromise(
    SponsorAccounts.SponsorAccounts.use((accounts) =>
      accounts.current(viewer.id),
    ).pipe(Effect.map(Option.getOrNull)),
  );
  // As the sponsor dashboard does for an account without a sponsor.
  if (!sponsor) redirect('/earn/');
  return (
    <SponsorLayout>
      <EditSponsorForm
        sponsor={{
          name: sponsor.name,
          slug: sponsor.slug,
          bio: sponsor.bio,
          logo: sponsor.logo,
          industry: sponsor.industry,
          url: sponsor.url,
          twitter: sponsor.twitter,
          entityName: sponsor.entityName,
          location: sponsor.location,
        }}
      />
    </SponsorLayout>
  );
}
