import { Suspense } from 'react';

import { SponsorLayout, sponsorMetadata } from '@/layouts/Sponsor';

import { SubmissionsPageSkeleton } from '@/features/sponsor-dashboard/components/Submissions/SubmissionsPageSkeleton';

import { ReviewPage } from '../../../listings/[slug]/submissions/review-page';

export const metadata = sponsorMetadata;

// A hackathon track's submissions, read-only.
export default async function HackathonSubmissionsPage(
  props: PageProps<'/earn/dashboard/hackathon/[listing]/submissions'>,
) {
  const { listing } = await props.params;
  return (
    <SponsorLayout isCollapsible>
      <Suspense fallback={<SubmissionsPageSkeleton />}>
        <ReviewPage slug={listing} hackathon />
      </Suspense>
    </SponsorLayout>
  );
}
