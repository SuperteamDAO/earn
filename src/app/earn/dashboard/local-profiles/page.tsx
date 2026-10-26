import * as Effect from 'effect/Effect';
import { Suspense } from 'react';

import { SponsorLayout, sponsorMetadata } from '@/layouts/Sponsor';
import { LocalProfilesSkeleton } from '@/layouts/SponsorLayoutSkeleton';
import { getViewer } from '@/lib/session';
import * as LocalProfiles from '@/server/local-profiles';
import { runtime } from '@/server/runtime';

import { LocalProfilesView } from '@/features/sponsor-dashboard/components/LocalProfiles/LocalProfilesView';

export const metadata = sponsorMetadata;

export default function LocalProfilesPage() {
  return (
    <SponsorLayout here="/earn/dashboard/local-profiles/">
      <Suspense fallback={<LocalProfilesSkeleton />}>
        <Profiles />
      </Suspense>
    </SponsorLayout>
  );
}

async function Profiles() {
  const viewer = await getViewer();
  if (!viewer) return null;
  // Without a chapter, or not its core, Earn's page showed no one.
  const profiles = await runtime.runPromise(
    LocalProfiles.LocalProfiles.use((service) => service.list(viewer.id)).pipe(
      Effect.catchTags({
        NoChapter: () => Effect.succeed([]),
        NotChapterCore: () => Effect.succeed([]),
      }),
    ),
  );
  return <LocalProfilesView profiles={profiles} />;
}
