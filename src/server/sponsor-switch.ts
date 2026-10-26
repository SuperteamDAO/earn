import 'server-only';

import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Schema from 'effect/Schema';

import * as Database from '@/server/database';

// What the dashboard's switchers list, in the shape react-select takes and
// Earn's /api/sponsors/list and /api/hackathon/list returned.
export interface SponsorOption {
  readonly value: string;
  readonly label: string;
  readonly sponsor: {
    readonly id: string;
    readonly name: string;
    readonly slug: string;
    readonly logo: string | null;
    readonly isVerified: boolean;
    readonly role: string;
  };
}

export interface HackathonOption {
  readonly value: string;
  readonly label: string;
  readonly hackathon: {
    readonly id: string;
    readonly name: string;
    readonly slug: string;
    readonly logo: string;
    readonly altLogo: string | null;
    readonly role: string;
  };
}

// They may not switch to it: not on its team (God mode excepted), or it
// doesn't exist.
export class SwitchRefused extends Schema.TaggedError<SwitchRefused>()(
  'SwitchRefused',
  {},
) {
  override get message() {
    return 'You do not have access to this sponsor profile';
  }
}

export class SponsorSwitch extends Context.Service<
  SponsorSwitch,
  {
    readonly sponsors: (
      userId: string,
      search: string,
    ) => Effect.Effect<ReadonlyArray<SponsorOption>, Database.DatabaseError>;
    // Sets `currentSponsorId`: one of their own sponsors, or any in God mode.
    readonly switchSponsor: (
      userId: string,
      sponsorId: string,
    ) => Effect.Effect<void, SwitchRefused | Database.DatabaseError>;
    readonly hackathons: (
      userId: string,
      search: string,
    ) => Effect.Effect<ReadonlyArray<HackathonOption>, Database.DatabaseError>;
    // Sets `hackathonId`, which only God mode may (Earn's /api/user/update).
    readonly switchHackathon: (
      userId: string,
      hackathonId: string,
    ) => Effect.Effect<void, SwitchRefused | Database.DatabaseError>;
  }
>()('earn/SponsorSwitch') {}

const SPONSOR = {
  id: true,
  name: true,
  slug: true,
  logo: true,
  isVerified: true,
} as const;

const make = Effect.gen(function* () {
  const database = yield* Database.Database;

  const roleOf = (userId: string) =>
    database
      .query('userRole', (client) =>
        client.user.findUnique({
          where: { id: userId },
          select: { role: true },
        }),
      )
      .pipe(Effect.map((user) => user?.role ?? null));

  const sponsors = Effect.fn('SponsorSwitch.sponsors')(function* (
    userId: string,
    search: string,
  ) {
    const god = (yield* roleOf(userId)) === 'GOD';
    if (god) {
      const rows = yield* database.query('sponsorSearch', (client) =>
        client.sponsors.findMany({
          where: search ? { name: { contains: search } } : {},
          take: 50,
          select: SPONSOR,
          orderBy: { slug: 'asc' },
        }),
      );
      return rows.map((sponsor): SponsorOption => ({
        value: sponsor.id,
        label: sponsor.name,
        sponsor: { ...sponsor, role: 'GOD MODE' },
      }));
    }
    const rows = yield* database.query('ownSponsors', (client) =>
      client.userSponsors.findMany({
        where: {
          userId,
          ...(search ? { sponsor: { name: { contains: search } } } : {}),
        },
        orderBy: { sponsor: { slug: 'asc' } },
        select: { role: true, sponsor: { select: SPONSOR } },
        take: 50,
      }),
    );
    return rows.map((row): SponsorOption => ({
      value: row.sponsor.id,
      label: row.sponsor.name,
      sponsor: { ...row.sponsor, role: row.role },
    }));
  });

  const switchSponsor = Effect.fn('SponsorSwitch.switchSponsor')(function* (
    userId: string,
    sponsorId: string,
  ) {
    const god = (yield* roleOf(userId)) === 'GOD';
    const allowed = yield* database.query('sponsorAccess', async (client) =>
      god
        ? await client.sponsors.findUnique({
            where: { id: sponsorId },
            select: { id: true },
          })
        : await client.userSponsors.findFirst({
            where: { userId, sponsorId },
            select: { sponsorId: true },
          }),
    );
    if (!allowed) return yield* new SwitchRefused();
    return yield* database
      .query('switchSponsor', (client) =>
        client.user.update({
          where: { id: userId },
          data: { currentSponsorId: sponsorId },
        }),
      )
      .pipe(Effect.asVoid);
  });

  const hackathons = Effect.fn('SponsorSwitch.hackathons')(function* (
    userId: string,
    search: string,
  ) {
    const god = (yield* roleOf(userId)) === 'GOD';
    const rows = yield* database.query('hackathonSearch', (client) =>
      client.hackathon.findMany({
        where: search ? { name: { contains: search } } : {},
        take: 30,
        select: { id: true, name: true, slug: true, logo: true, altLogo: true },
        orderBy: god ? { slug: 'asc' } : { announceDate: 'desc' },
      }),
    );
    // Earn labels every option God mode, whoever asks.
    return rows.map((hackathon): HackathonOption => ({
      value: hackathon.id,
      label: hackathon.name,
      hackathon: { ...hackathon, role: 'GOD MODE' },
    }));
  });

  const switchHackathon = Effect.fn('SponsorSwitch.switchHackathon')(function* (
    userId: string,
    hackathonId: string,
  ) {
    if ((yield* roleOf(userId)) !== 'GOD') return yield* new SwitchRefused();
    const hackathon = yield* database.query('hackathonExists', (client) =>
      client.hackathon.findUnique({
        where: { id: hackathonId },
        select: { id: true },
      }),
    );
    if (!hackathon) return yield* new SwitchRefused();
    return yield* database
      .query('switchHackathon', (client) =>
        client.user.update({ where: { id: userId }, data: { hackathonId } }),
      )
      .pipe(Effect.asVoid);
  });

  return SponsorSwitch.of({
    sponsors,
    switchSponsor,
    hackathons,
    switchHackathon,
  });
});

export const layer = Layer.effect(SponsorSwitch, make);
