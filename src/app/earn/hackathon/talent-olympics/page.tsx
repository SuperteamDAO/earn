import 'server-only';

import * as Effect from 'effect/Effect';

import { pageMetadata } from '@/lib/metadata';
import * as Hackathons from '@/server/hackathons';
import { runtime } from '@/server/runtime';

import { rankedUsers } from './ranked-users';
import { TalentOlympicsView } from './talent-olympics-view';

export const metadata = pageMetadata({
  title: 'Talent Olympics | Superteam Earn',
  description:
    'Explore the latest bounties on Superteam Earn, offering opportunities in the crypto space across Design, Development, and Content.',
  canonical: 'https://superteam.fun/earn/hackathon/talent-olympics/',
});

export default async function Page() {
  const [{ countryLeaders, profiles }, subscriptions] = await Promise.all([
    runtime.runPromise(
      Hackathons.Hackathons.use((hackathons) =>
        hackathons.talentOlympics(rankedUsers.map((u) => u.email)),
      ),
    ),
    runtime.runPromise(
      Hackathons.Hackathons.use((hackathons) =>
        hackathons.subscriptions('talent-olympics'),
      ).pipe(Effect.orElseSucceed(() => [])),
    ),
  ]);

  // Ranked people without an Earn account are left out.
  const rankings = rankedUsers
    .flatMap((u) => {
      const user = profiles.find((p) => p.email === u.email);
      return user ? [{ user, rating: u.rating }] : [];
    })
    .toSorted((a, b) => b.rating - a.rating);

  return (
    <TalentOlympicsView
      countryLeaders={countryLeaders}
      rankings={rankings}
      subscriptions={subscriptions}
    />
  );
}
