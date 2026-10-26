import 'server-only';

import * as Clock from 'effect/Clock';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import * as Schema from 'effect/Schema';

import { Home } from '@/layouts/Home';
import { getViewer } from '@/lib/session';
import * as Hackathons from '@/server/hackathons';
import { runtime } from '@/server/runtime';

import { HackathonSection } from '@/features/hackathon/components/HackathonSection';

const one = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

// A parameter the schema accepts, else its default (as Earn's client read
// them); the hackathon name isn't defaulted: an unknown one fails the list.
const pick = <A extends string>(
  value: string | undefined,
  allowed: ReadonlyArray<A>,
  fallback: A,
): A => allowed.find((item) => item === value) ?? fallback;

const decodeQuery = Schema.decodeUnknownOption(Hackathons.HackathonListQuery);

export default async function AllHackathonsPage({
  searchParams,
}: PageProps<'/earn/hackathon/all'>) {
  const params = await searchParams;
  const query = decodeQuery({
    context: 'all',
    name: one(params.hackathon) ?? 'All',
    status: pick(
      one(params.hackathonStatus),
      ['open', 'review', 'completed'],
      'open',
    ),
    sortBy: pick(
      one(params.hackathonSortBy),
      ['Prize', 'Submissions'],
      'Prize',
    ),
    order: pick(one(params.hackathonOrder), ['asc', 'desc'], 'desc'),
  });
  const viewer = await getViewer();
  const [listings, now] = await Promise.all([
    Option.isNone(query)
      ? null
      : runtime.runPromise(
          Hackathons.Hackathons.use((hackathons) =>
            hackathons.list(query.value, viewer),
          ).pipe(Effect.orElseSucceed(() => null)),
        ),
    runtime.runPromise(Clock.currentTimeMillis),
  ]);
  return (
    <Home type="listing">
      <div className="w-full">
        <HackathonSection type="all" listings={listings} now={now} />
      </div>
    </Home>
  );
}
