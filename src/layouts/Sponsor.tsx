import * as Effect from 'effect/Effect';
import { redirect } from 'next/navigation';
import { type ReactNode, Suspense } from 'react';

import { Default } from '@/layouts/Default';
import { ResumingPage } from '@/lib/auth/resume-session';
import { pageMetadata } from '@/lib/metadata';
import { requestPath } from '@/lib/request-path';
import { signInHref } from '@/lib/safe-next';
import { canResume, getSession, getViewer } from '@/lib/session';
import { runtime } from '@/server/runtime';
import * as SponsorDashboard from '@/server/sponsor-dashboard';

import { SignInHere } from '@/features/sponsor-dashboard/components/SignInHere';
import { SponsorFrame } from '@/features/sponsor-dashboard/components/SponsorFrame';

// The <head> Earn's SponsorLayout gave every dashboard page.
export const sponsorMetadata = pageMetadata({
  title: 'Superteam Earn | Work to Earn in Crypto',
  description:
    'Explore the latest bounties on Superteam Earn, offering opportunities in the crypto space across Design, Development, and Content.',
  noIndex: true,
});

// The sponsor dashboard's frame (sidebar, sponsor switcher, create-listing
// menu, profile modals) around a dashboard page. Signed out, the visitor
// goes to sign in and comes back to `here` (this page's URL; when a page
// doesn't pass it, the browser's); without a sponsor, to Earn's home.
export async function SponsorLayout({
  children,
  isCollapsible = false,
  here,
}: {
  children: ReactNode;
  isCollapsible?: boolean;
  here?: string;
}) {
  const viewer = await getViewer();
  if (!viewer) {
    if (await getSession()) redirect('/earn/');
    const resume = await canResume();
    here ??= (await requestPath()) ?? undefined;
    if (here) {
      if (resume) {
        return (
          <Default className="bg-white">
            <ResumingPage signIn={signInHref(here)} />
          </Default>
        );
      }
      redirect(signInHref(here));
    }
    return (
      <Default className="bg-white">
        <Suspense>
          <SignInHere canResume={resume} />
        </Suspense>
      </Default>
    );
  }
  if (!viewer.currentSponsorId) redirect('/earn/');
  const sponsorId = viewer.currentSponsorId;

  const [hackathons, isCreateListingAllowed] = await runtime.runPromise(
    SponsorDashboard.SponsorDashboard.use((dashboard) =>
      Effect.all(
        [dashboard.activeHackathons, dashboard.createAllowed(sponsorId)],
        { concurrency: 'unbounded' },
      ),
    ).pipe(
      // The frame still works without them: no hackathon tracks to offer,
      // and creating stays unlocked (the builder checks again).
      Effect.catchTag('DatabaseError', () =>
        Effect.succeed([[], true] as const),
      ),
    ),
  );

  return (
    <Default className="bg-white">
      <Suspense>
        <SponsorFrame
          isCollapsible={isCollapsible}
          hackathons={hackathons}
          isCreateListingAllowed={isCreateListingAllowed}
        >
          {children}
        </SponsorFrame>
      </Suspense>
    </Default>
  );
}
