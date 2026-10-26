import { Suspense } from 'react';

import { SponsorLayout, sponsorMetadata } from '@/layouts/Sponsor';

import { SubmissionsPageSkeleton } from '@/features/sponsor-dashboard/components/Submissions/SubmissionsPageSkeleton';

import { GrantReviewPage } from './grant-review-page';

export const metadata = sponsorMetadata;

// Reviewing a grant's applications, its tranche requests and its payments.
export default async function GrantApplicationsPage(
  props: PageProps<'/earn/dashboard/grants/[slug]/applications'>,
) {
  const { slug } = await props.params;
  const here = `/earn/dashboard/grants/${encodeURIComponent(slug)}/applications/`;
  return (
    <SponsorLayout isCollapsible here={here}>
      <Suspense fallback={<SubmissionsPageSkeleton />}>
        <GrantReviewPage slug={slug} />
      </Suspense>
    </SponsorLayout>
  );
}
