import 'server-only';

import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import * as Database from '@/server/database';

export interface SponsorPage {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly bio: string | null;
  readonly logo: string | null;
  readonly url: string | null;
  readonly twitter: string | null;
  readonly isVerified: boolean;
}

// The public sponsor pages' lookups: /earn/s/[slug]/, and the old
// /earn/[sponsor]/ links that redirect there.
export class SponsorPages extends Context.Service<
  SponsorPages,
  {
    readonly bySlug: (
      slug: string,
    ) => Effect.Effect<SponsorPage | null, Database.DatabaseError>;
    // The slug of the sponsor named `name`.
    readonly slugByName: (
      name: string,
    ) => Effect.Effect<string | null, Database.DatabaseError>;
  }
>()('earn/SponsorPages') {}

const make = Effect.gen(function* () {
  const database = yield* Database.Database;

  const bySlug = (slug: string) =>
    database.query('sponsorPage', (client) =>
      client.sponsors.findUnique({
        where: { slug },
        select: {
          id: true,
          name: true,
          slug: true,
          bio: true,
          logo: true,
          url: true,
          twitter: true,
          isVerified: true,
        },
      }),
    );

  const slugByName = (name: string) =>
    database
      .query('sponsorSlugByName', (client) =>
        client.sponsors.findUnique({ where: { name }, select: { slug: true } }),
      )
      .pipe(Effect.map((row) => row?.slug ?? null));

  return SponsorPages.of({ bySlug, slugByName });
});

export const layer = Layer.effect(SponsorPages, make);
