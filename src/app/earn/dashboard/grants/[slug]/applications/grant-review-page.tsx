import 'server-only';

import * as Effect from 'effect/Effect';
import { notFound } from 'next/navigation';

import { getSession } from '@/lib/session';
import type * as Database from '@/server/database';
import * as GrantReview from '@/server/grant-review';
import { runtime } from '@/server/runtime';
import * as Users from '@/server/users';

import {
  NotYourGrant,
  SwitchGrantSponsor,
} from '@/features/sponsor-dashboard/components/GrantApplications/GrantAccess';
import { GrantReviewBoard } from '@/features/sponsor-dashboard/components/GrantApplications/GrantReviewBoard';

// As in Earn, a list that fails to load shows empty.
const orEmpty = <A,>(
  list: Effect.Effect<
    ReadonlyArray<A>,
    GrantReview.ReviewRefused | Database.DatabaseError
  >,
) =>
  list.pipe(
    Effect.catchTag('ReviewRefused', () =>
      Effect.succeed<ReadonlyArray<A>>([]),
    ),
  );

const sponsorIdOf = (body: unknown) =>
  typeof body === 'object' &&
  body !== null &&
  'sponsorId' in body &&
  typeof body.sponsorId === 'string'
    ? body.sponsorId
    : null;

// The grant, its applications, tranches and approved grantees, loaded on
// the server; the frame (SponsorLayout) has already seen to signing in and
// the sponsor.
export async function GrantReviewPage({ slug }: { slug: string }) {
  const session = await getSession();
  if (!session) return null;
  const page = await runtime.runPromise(
    Effect.gen(function* () {
      const sponsor = yield* Users.Users.use((users) =>
        users.sponsorWriter(session.userId),
      );
      return yield* GrantReview.GrantReview.use((review) =>
        Effect.gen(function* () {
          const grant = yield* review.grant(sponsor, slug);
          const [applications, tranches, grantees] = yield* Effect.all(
            [
              orEmpty(review.applications(sponsor, slug)),
              orEmpty(review.tranches(sponsor, slug)),
              orEmpty(review.approvedGrantees(sponsor, grant.id, '')),
            ],
            { concurrency: 'unbounded' },
          );
          return {
            _tag: 'Ready' as const,
            grant,
            applications,
            tranches,
            grantees,
          };
        }),
      );
    }).pipe(
      Effect.catchTag('ReviewRefused', (error) =>
        Effect.succeed(
          error.status === 403
            ? { _tag: 'Refused' as const, sponsorId: sponsorIdOf(error.body) }
            : { _tag: 'NotFound' as const },
        ),
      ),
      // The frame turns these away before the page loads.
      Effect.catchTags({
        NoAccount: () => Effect.succeed({ _tag: 'NotFound' as const }),
        Blocked: () => Effect.succeed({ _tag: 'NotFound' as const }),
        NoSponsor: () => Effect.succeed({ _tag: 'NotFound' as const }),
      }),
    ),
  );
  switch (page._tag) {
    case 'NotFound':
      notFound();
    // eslint-disable-next-line no-fallthrough
    case 'Refused':
      return page.sponsorId ? (
        <SwitchGrantSponsor sponsorId={page.sponsorId} />
      ) : (
        <NotYourGrant />
      );
    default:
      return (
        <GrantReviewBoard
          key={page.grant.id}
          slug={slug}
          grant={page.grant}
          applications={[...page.applications]}
          tranches={[...page.tranches]}
          grantees={[...page.grantees]}
        />
      );
  }
}
