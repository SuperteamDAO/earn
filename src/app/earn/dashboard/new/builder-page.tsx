import * as Effect from 'effect/Effect';
import { redirect } from 'next/navigation';

import { ErrorSection } from '@/components/shared/ErrorSection';
import { Default } from '@/layouts/Default';
import { ResumingPage } from '@/lib/auth/resume-session';
import { pageMetadata } from '@/lib/metadata';
import { safeNext, signInHref } from '@/lib/safe-next';
import { canResume, getSession, getViewer } from '@/lib/session';
import * as ListingBuilderService from '@/server/listing-builder';
import * as ListingTemplates from '@/server/listing-templates';
import { runtime } from '@/server/runtime';

import { ListingBuilder } from '@/features/listing-builder/components/ListingBuilder';
import { OtherSponsorListing } from '@/features/listing-builder/components/OtherSponsorListing';
import { Header } from '@/features/navbar/components/Header';

// What Earn's builder pages set in <head>.
export const builderMetadata = pageMetadata({
  title: 'Create a Listing | Superteam Earn',
  description:
    'Create a listing on Superteam Earn and gain access to thousands of high quality talent',
  noIndex: true,
});

const load = (privyDid: string, slug: string | null) =>
  runtime.runPromise(
    Effect.all(
      [
        ListingBuilderService.ListingBuilder.use((builder) =>
          builder.page(privyDid, slug),
        ),
        // Earn answered no templates as an error, so the picker showed none.
        ListingTemplates.ListingTemplates.use((templates) =>
          templates.list('bounty'),
        ).pipe(Effect.orElseSucceed(() => [])),
      ],
      { concurrency: 2 },
    ),
  );

// The listing builder (new, edit, duplicate), as Earn rendered it: its own
// full-screen form with its own header, for the current sponsor.
export async function BuilderPage({
  route,
  slug,
  here,
}: {
  route: 'new' | 'edit' | 'duplicate';
  slug: string | null;
  here: string;
}) {
  const [session, viewer] = await Promise.all([getSession(), getViewer()]);
  if (!session || !viewer) {
    if (await canResume()) return <ResumingPage signIn={signInHref(here)} />;
    redirect(signInHref(safeNext(here)));
  }
  if (!viewer.currentSponsor?.id && viewer.role !== 'GOD') redirect('/earn/');

  const [page, templates] = await load(session.userId, slug);
  if (page.kind === 'other-sponsor') {
    return <OtherSponsorListing sponsorId={page.sponsorId} />;
  }
  if (page.kind === 'not-found' || (route !== 'new' && !page.listing)) {
    return (
      <Default>
        <Header />
        <ErrorSection message="Sorry! The bounty you are looking for is not available." />
      </Default>
    );
  }
  return (
    <ListingBuilder
      route={route}
      listing={page.listing}
      hackathons={[...page.hackathons]}
      createAllowed={page.createAllowed}
      templates={[...templates]}
    />
  );
}
