import 'server-only';

import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import { notFound } from 'next/navigation';
import { cache } from 'react';

import type { TrackProps } from '@/interface/hackathon';
import type { Stats } from '@/queries/hackathon';
import * as Hackathons from '@/server/hackathons';
import { runtime } from '@/server/runtime';

// A hackathon page's record, or the page 404s.
export const loadHackathon = cache(
  async (slug: string): Promise<Hackathons.HackathonWithSponsor> => {
    const hackathon = await runtime.runPromise(
      Hackathons.Hackathons.use((hackathons) => hackathons.bySlug(slug)),
    );
    if (Option.isNone(hackathon)) notFound();
    return hackathon.value;
  },
);

// Its tracks, null when they couldn't be loaded (the page offers a retry).
export const loadTracks = (slug: string): Promise<TrackProps[] | null> =>
  runtime.runPromise(
    Hackathons.Hackathons.use((hackathons) => hackathons.tracks(slug)).pipe(
      Effect.map((tracks): TrackProps[] | null =>
        tracks.map((track) => ({
          ...track,
          token: track.token ?? '',
          rewardAmount: track.rewardAmount ?? 0,
          sponsor: { ...track.sponsor, logo: track.sponsor.logo ?? '' },
        })),
      ),
      Effect.orElseSucceed(() => null),
    ),
  );

// Its prize pool and track count, null when unavailable.
export const loadStats = (slug: string): Promise<Stats | null> =>
  runtime.runPromise(
    Hackathons.Hackathons.use((hackathons) =>
      hackathons.publicStats(slug),
    ).pipe(
      Effect.map((stats): Stats | null => stats),
      Effect.orElseSucceed(() => null),
    ),
  );
