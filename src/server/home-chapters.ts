import 'server-only';

import * as Context from 'effect/Context';
import * as Duration from 'effect/Duration';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import * as Database from '@/server/database';
import { cached } from '@/server/home-cache';
import type { ChapterRegion } from '@/server/home-regions';

const parseCountries = (raw: unknown): string[] =>
  Array.isArray(raw)
    ? raw.filter((country): country is string => typeof country === 'string')
    : [];

// Earn's active Superteam chapters, as utils/chapterRegion.ts loads them:
// region rules, region pages and the footer's region picker read them.
export class HomeChapters extends Context.Service<
  HomeChapters,
  {
    readonly all: Effect.Effect<
      ReadonlyArray<ChapterRegion>,
      Database.DatabaseError
    >;
  }
>()('earn/HomeChapters') {}

const make = Effect.gen(function* () {
  const database = yield* Database.Database;

  // Earn kept them five minutes in memory.
  const all = yield* cached(
    database
      .query('activeChapters', (client) =>
        client.chapter.findMany({
          where: { active: true },
          select: {
            id: true,
            name: true,
            region: true,
            displayValue: true,
            slug: true,
            code: true,
            countries: true,
            banner: true,
            icons: true,
            link: true,
            hello: true,
            nationality: true,
          },
        }),
      )
      .pipe(
        Effect.map((rows) =>
          rows.map((chapter): ChapterRegion => ({
            id: chapter.id,
            name: chapter.name,
            region: chapter.region,
            displayValue: chapter.displayValue || chapter.region,
            slug: chapter.slug,
            code: chapter.code || '',
            country: parseCountries(chapter.countries),
            banner: chapter.banner,
            icons: chapter.icons,
            link: chapter.link,
            hello: chapter.hello,
            nationality: chapter.nationality,
          })),
        ),
      ),
    Duration.minutes(5),
  );

  return HomeChapters.of({ all });
});

export const layer = Layer.effect(HomeChapters, make);
