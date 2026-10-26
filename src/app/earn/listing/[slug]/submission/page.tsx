import * as Effect from 'effect/Effect';

import { ListingPageLayout } from '@/layouts/Listing';
import * as ListingDetails from '@/server/listing-details';
import { runtime } from '@/server/runtime';

import { SubmissionList } from '@/features/listings/components/SubmissionsPage/SubmissionList';

import { listingMetadata } from '../listing-metadata';

// The Submissions tab: a published listing's submissions, once winners are
// announced. A failed load shows Earn's error section.
const submissionsOf = (slug: string) =>
  runtime.runPromise(
    ListingDetails.ListingDetails.use((details) =>
      details.submissionsTab(slug),
    ).pipe(
      Effect.catchTag('DatabaseError', () =>
        Effect.succeed({ bounty: null, submission: [] }),
      ),
    ),
  );

export async function generateMetadata({
  params,
}: PageProps<'/earn/listing/[slug]/submission'>) {
  const { slug } = await params;
  const { bounty } = await submissionsOf(slug);
  return listingMetadata(bounty, { slug, preview: false, noIndex: true });
}

export default async function SubmissionPage({
  params,
}: PageProps<'/earn/listing/[slug]/submission'>) {
  const { slug } = await params;
  const { bounty, submission } = await submissionsOf(slug);
  return (
    <ListingPageLayout listing={bounty}>
      {bounty && (
        <SubmissionList
          bounty={bounty}
          submissions={submission}
          endTime={bounty.deadline ?? ''}
        />
      )}
    </ListingPageLayout>
  );
}
