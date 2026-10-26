import { Suspense } from 'react';

import { SponsorLayout, sponsorMetadata } from '@/layouts/Sponsor';

import { SubmissionsPageSkeleton } from '@/features/sponsor-dashboard/components/Submissions/SubmissionsPageSkeleton';

import { ReviewPage } from './review-page';

export const metadata = sponsorMetadata;

// Reviewing a bounty's submissions: labels, notes, spam, winners, the
// announcement and paying the winners.
export default async function BountySubmissionsPage(
  props: PageProps<'/earn/dashboard/listings/[slug]/submissions'>,
) {
  const { slug } = await props.params;
  const tab = (await props.searchParams).tab;
  const here = `/earn/dashboard/listings/${encodeURIComponent(slug)}/submissions/${tab === 'payments' ? '?tab=payments' : ''}`;
  return (
    <SponsorLayout isCollapsible here={here}>
      <Suspense fallback={<SubmissionsPageSkeleton />}>
        <ReviewPage slug={slug} hackathon={false} />
      </Suspense>
    </SponsorLayout>
  );
}
