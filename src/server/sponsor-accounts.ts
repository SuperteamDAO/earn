import 'server-only';

import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as Schema from 'effect/Schema';

import { isSanctionedCountry } from '@/constants/country';
import { URL_REGEX } from '@/constants/URL_REGEX';
import type { Sponsors as SponsorRow } from '@/prisma/client';
import * as Database from '@/server/database';
import * as SponsorIntegrations from '@/server/sponsor-integrations';
import type * as Users from '@/server/users';

import { extractSocialUsername } from '@/features/social/utils/extractUsername';

export class InvalidSponsor extends Schema.TaggedError<InvalidSponsor>()(
  'InvalidSponsor',
  {},
) {
  override get message() {
    return 'Invalid sponsor data';
  }
}

// The logo isn't an image in Earn's storage.
export class LogoMissing extends Schema.TaggedError<LogoMissing>()(
  'LogoMissing',
  {},
) {
  override get message() {
    return 'Invalid logo: Image does not exist in our storage';
  }
}

// Another sponsor has the name or slug.
export class SponsorTaken extends Schema.TaggedError<SponsorTaken>()(
  'SponsorTaken',
  {},
) {
  override get message() {
    return 'Sponsor name or username already exists';
  }
}

// They already act for a sponsor, and only God mode makes more.
export class AlreadySponsor extends Schema.TaggedError<AlreadySponsor>()(
  'AlreadySponsor',
  {},
) {
  override get message() {
    return 'Account already has a sponsor';
  }
}

export class UserNotFound extends Schema.TaggedError<UserNotFound>()(
  'UserNotFound',
  {},
) {
  override get message() {
    return 'User not found';
  }
}

const filled = Schema.isMinLength(1);
const noHtml = Schema.makeFilter((value: string) => !/[<>]/.test(value));

// Earn's sponsorBaseSchema. `twitter` is the bare handle here; it is stored
// as an x.com link.
const SponsorFields = Schema.Struct({
  name: Schema.String.check(filled, noHtml),
  slug: Schema.String.check(filled, Schema.isPattern(/^[a-zA-Z0-9-]+$/)),
  bio: Schema.String.check(filled, Schema.isMaxLength(180), noHtml),
  logo: Schema.String.check(filled),
  industry: Schema.String.check(filled),
  url: Schema.String.check(filled, Schema.isPattern(URL_REGEX)),
  twitter: Schema.String.check(
    filled,
    Schema.isMaxLength(15),
    Schema.isPattern(/^[a-zA-Z0-9_]+$/),
  ),
  entityName: Schema.String.check(filled, noHtml),
  location: Schema.String.check(
    filled,
    Schema.makeFilter((value: string) => !isSanctionedCountry(value)),
  ),
});

export type SponsorFields = typeof SponsorFields.Type;

// A sponsor form's body as it arrives: Earn's client sends the X link,
// which the handle is read from.
export type SponsorBody = Readonly<Record<string, unknown>>;

// Validated and normalized as Earn stores it, or None.
export function sponsorFields(body: SponsorBody): Option.Option<SponsorFields> {
  const twitter =
    typeof body.twitter === 'string'
      ? (extractSocialUsername('twitter', body.twitter) ?? '')
      : body.twitter;
  return Schema.decodeUnknownOption(SponsorFields)({ ...body, twitter }).pipe(
    Option.map((fields) => ({
      ...fields,
      slug: fields.slug.toLowerCase(),
      twitter: `https://x.com/${fields.twitter}`,
    })),
  );
}

// The email categories a new sponsor admin starts subscribed to.
const SPONSOR_EMAILS = [
  'commentSponsor',
  'deadlineSponsor',
  'productAndNewsletter',
  'replyOrTagComment',
] as const;

const SPONSOR_SUMMARY = {
  id: true,
  name: true,
  slug: true,
  logo: true,
  isVerified: true,
} as const;

// One option of the sponsor switcher, as Earn's /api/sponsors/list sends it.
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

const isUniqueViolation = (error: Database.DatabaseError) =>
  typeof error.cause === 'object' &&
  error.cause !== null &&
  'code' in error.cause &&
  error.cause.code === 'P2002';

type Failure = Database.DatabaseError;

export class SponsorAccounts extends Context.Service<
  SponsorAccounts,
  {
    readonly nameAvailable: (name: string) => Effect.Effect<boolean, Failure>;
    readonly slugAvailable: (slug: string) => Effect.Effect<boolean, Failure>;
    // The sponsor they act for; None without one.
    readonly current: (
      userId: string,
    ) => Effect.Effect<Option.Option<SponsorRow>, UserNotFound | Failure>;
    // Sponsors they may switch to: their own, or any in God mode.
    readonly list: (
      writer: Users.SponsorWriter,
      search: string,
      take: number,
    ) => Effect.Effect<ReadonlyArray<SponsorOption>, Failure>;
    // Makes a sponsor with them as its admin, and switches them to it.
    readonly create: (
      writer: Users.Writer,
      body: SponsorBody,
    ) => Effect.Effect<
      SponsorRow,
      | UserNotFound
      | InvalidSponsor
      | LogoMissing
      | AlreadySponsor
      | SponsorTaken
      | Failure
    >;
    readonly edit: (
      writer: Users.SponsorWriter,
      body: SponsorBody,
    ) => Effect.Effect<
      SponsorRow,
      InvalidSponsor | LogoMissing | SponsorTaken | Failure
    >;
    readonly updateEntityName: (
      writer: Users.SponsorWriter,
      entityName: string,
    ) => Effect.Effect<SponsorRow, Failure>;
  }
>()('earn/SponsorAccounts') {}

const validate = (body: SponsorBody) =>
  Effect.fromOption(sponsorFields(body)).pipe(
    Effect.mapError(() => new InvalidSponsor()),
  );

const taken = <A>(effect: Effect.Effect<A, Database.DatabaseError>) =>
  effect.pipe(
    Effect.catchIf(isUniqueViolation, () => Effect.fail(new SponsorTaken())),
  );

const make = Effect.gen(function* () {
  const database = yield* Database.Database;
  const integrations = yield* SponsorIntegrations.SponsorIntegrations;

  const nameAvailable = Effect.fn('SponsorAccounts.nameAvailable')(function* (
    name: string,
  ) {
    const sponsor = yield* database.query('sponsorByName', (client) =>
      client.sponsors.findUnique({ where: { name }, select: { id: true } }),
    );
    return sponsor === null;
  });

  const slugAvailable = Effect.fn('SponsorAccounts.slugAvailable')(function* (
    slug: string,
  ) {
    const sponsor = yield* database.query('sponsorBySlug', (client) =>
      client.sponsors.findUnique({ where: { slug }, select: { id: true } }),
    );
    return sponsor === null;
  });

  const current = Effect.fn('SponsorAccounts.current')(function* (
    userId: string,
  ) {
    const user = yield* database.query('currentSponsor', (client) =>
      client.user.findUnique({
        where: { id: userId },
        select: { currentSponsor: true },
      }),
    );
    if (!user) return yield* new UserNotFound();
    return Option.fromNullishOr(user.currentSponsor);
  });

  const list = Effect.fn('SponsorAccounts.list')(function* (
    writer: Users.SponsorWriter,
    search: string,
    take: number,
  ) {
    if (writer.god) {
      const sponsors = yield* database.query('godSponsors', (client) =>
        client.sponsors.findMany({
          where: search ? { name: { contains: search } } : {},
          take,
          select: SPONSOR_SUMMARY,
          orderBy: { slug: 'asc' },
        }),
      );
      return sponsors.map((sponsor): SponsorOption => ({
        value: sponsor.id,
        label: sponsor.name,
        sponsor: { ...sponsor, role: 'GOD MODE' },
      }));
    }
    const memberships = yield* database.query('memberSponsors', (client) =>
      client.userSponsors.findMany({
        where: {
          userId: writer.userId,
          ...(search ? { sponsor: { name: { contains: search } } } : {}),
        },
        orderBy: { sponsor: { slug: 'asc' } },
        select: { role: true, sponsor: { select: SPONSOR_SUMMARY } },
        take,
      }),
    );
    return memberships.map(({ role, sponsor }): SponsorOption => ({
      value: sponsor.id,
      label: sponsor.name,
      sponsor: { ...sponsor, role },
    }));
  });

  // Whether the logo is in Earn's storage: None when Cloudinary can't say,
  // which Earn lets pass.
  const checkLogo = (logo: string) =>
    integrations.imageExists(logo).pipe(
      Effect.asSome,
      Effect.catch(() =>
        Effect.logWarning('Logo verification error').pipe(
          Effect.as(Option.none<boolean>()),
        ),
      ),
      Effect.flatMap((exists) =>
        Option.contains(exists, false)
          ? Effect.fail(new LogoMissing())
          : Effect.succeed(Option.isSome(exists)),
      ),
    );

  const create = Effect.fn('SponsorAccounts.create')(function* (
    writer: Users.Writer,
    body: SponsorBody,
  ) {
    const user = yield* database.query('sponsorCreator', (client) =>
      client.user.findUnique({
        where: { id: writer.userId },
        select: { currentSponsorId: true, role: true },
      }),
    );
    if (!user) return yield* new UserNotFound();
    const fields = yield* validate(body);
    // Unverifiable, Earn creates it without a logo.
    const logo = (yield* checkLogo(fields.logo)) ? fields.logo : undefined;
    if (user.currentSponsorId && user.role !== 'GOD') {
      return yield* new AlreadySponsor();
    }
    return yield* taken(
      database.query('createSponsor', (client) =>
        client.$transaction(async (tx) => {
          const sponsor = await tx.sponsors.create({
            data: { ...fields, logo },
          });
          await tx.userSponsors.create({
            data: {
              userId: writer.userId,
              sponsorId: sponsor.id,
              role: 'ADMIN',
            },
          });
          await tx.user.update({
            where: { id: writer.userId },
            data: { currentSponsorId: sponsor.id },
          });
          for (const category of SPONSOR_EMAILS) {
            await tx.emailSettings.deleteMany({
              where: { userId: writer.userId, category },
            });
            await tx.emailSettings.create({
              data: { userId: writer.userId, category },
            });
          }
          return sponsor;
        }),
      ),
    );
  });

  const edit = Effect.fn('SponsorAccounts.edit')(function* (
    writer: Users.SponsorWriter,
    body: SponsorBody,
  ) {
    const fields = yield* validate(body);
    const before = yield* database.query('sponsorBeforeEdit', (client) =>
      client.sponsors.findUnique({
        where: { id: writer.sponsorId },
        select: { name: true, logo: true },
      }),
    );
    // Unverifiable, the logo stays as it was.
    const logo = (yield* checkLogo(fields.logo))
      ? fields.logo
      : (before?.logo ?? fields.logo);
    const sponsor = yield* taken(
      database.query('editSponsor', (client) =>
        client.sponsors.update({
          where: { id: writer.sponsorId },
          data: { ...fields, logo },
        }),
      ),
    );
    if (before && before.name !== fields.name) {
      yield* integrations.renameGdpSponsor(before.name, fields.name);
    }
    return sponsor;
  });

  const updateEntityName = Effect.fn('SponsorAccounts.updateEntityName')(
    function* (writer: Users.SponsorWriter, entityName: string) {
      return yield* database.query('sponsorEntityName', (client) =>
        client.sponsors.update({
          where: { id: writer.sponsorId },
          data: { entityName },
        }),
      );
    },
  );

  return SponsorAccounts.of({
    nameAvailable,
    slugAvailable,
    current,
    list,
    create,
    edit,
    updateEntityName,
  });
});

export const layer = Layer.effect(SponsorAccounts, make);
