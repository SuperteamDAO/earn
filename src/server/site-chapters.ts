import 'server-only';

import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as Layer from 'effect/Layer';

import * as Database from '@/server/database';

// An active Superteam chapter, as Earn's `getChapterRegions` gives it and
// `/api/chapters` returns it.
export interface Chapter {
  readonly id: string;
  readonly name: string;
  readonly region: string;
  // The chapter's display name, or its region.
  readonly displayValue: string;
  readonly slug: string;
  readonly code: string;
  readonly country: ReadonlyArray<string>;
  readonly banner: string | null;
  readonly icons: string | null;
  readonly link: string | null;
  readonly hello: string | null;
  readonly nationality: string | null;
}

export interface CoreMember {
  readonly id: string;
  readonly name: string;
}

export class SiteChapters extends Context.Service<
  SiteChapters,
  {
    // Every active chapter, cached for five minutes as Earn cached them.
    readonly list: Effect.Effect<
      ReadonlyArray<Chapter>,
      Database.DatabaseError
    >;
    // The chapters' display names, once each, sorted.
    readonly countries: Effect.Effect<
      ReadonlyArray<string>,
      Database.DatabaseError
    >;
    // A chapter's core members with an Earn account that isn't blocked, by
    // name, for the listing builder's sponsor verification.
    readonly coreMembers: (
      chapterId: string,
    ) => Effect.Effect<ReadonlyArray<CoreMember>, Database.DatabaseError>;
  }
>()('earn/SiteChapters') {}

const countriesOf = (raw: unknown): ReadonlyArray<string> =>
  Array.isArray(raw)
    ? raw.filter((country): country is string => typeof country === 'string')
    : [];

const make = Effect.gen(function* () {
  const db = yield* Database.Database;

  const load = db
    .query('chapters.active', (client) =>
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
        rows.map((row): Chapter => ({
          id: row.id,
          name: row.name,
          region: row.region,
          displayValue: row.displayValue || row.region,
          slug: row.slug,
          code: row.code || '',
          country: countriesOf(row.countries),
          banner: row.banner,
          icons: row.icons,
          link: row.link,
          hello: row.hello,
          nationality: row.nationality,
        })),
      ),
    );

  // Failures aren't kept: the next request asks again.
  const list = yield* Effect.cachedWithTTL(load, (exit) =>
    Exit.isSuccess(exit) ? '5 minutes' : 0,
  );

  const countries = list.pipe(
    Effect.map((chapters) =>
      Array.from(
        new Set(chapters.map((chapter) => chapter.displayValue)),
      ).toSorted(),
    ),
  );

  const coreMembers = Effect.fn('SiteChapters.coreMembers')(function* (
    chapterId: string,
  ) {
    const users = yield* db.query('chapters.coreMembers', (client) =>
      client.user.findMany({
        where: {
          isBlocked: false,
          people: { is: { chapterId, type: { in: ['core'] } } },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          people: { select: { name: true } },
        },
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      }),
    );
    return users
      .map((user) => {
        const fullName = [user.firstName, user.lastName]
          .filter(Boolean)
          .join(' ')
          .trim();
        return { id: user.id, name: fullName || user.people?.name || '' };
      })
      .filter((user) => Boolean(user.name));
  });

  return SiteChapters.of({ list, countries, coreMembers });
});

export const layer = Layer.effect(SiteChapters, make);
