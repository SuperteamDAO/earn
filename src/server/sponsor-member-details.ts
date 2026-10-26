import 'server-only';

import { v2 as cloudinary } from 'cloudinary';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as Redacted from 'effect/Redacted';
import * as Schema from 'effect/Schema';

import * as AppConfig from '@/server/app-config';
import * as Database from '@/server/database';

const TELEGRAM_LINK =
  /^(?:https?:\/\/)?(?:www\.)?(?:t\.me|telegram\.me)\/([^/]+)\/?$/;

const between = (min: number, max: number) =>
  [Schema.isMinLength(min), Schema.isMaxLength(max)] as const;

// Earn's userSponsorDetailsSchema: what a sponsor's team member tells about
// themselves (the dashboard's "Complete Your Profile", sponsor onboarding).
export const Details = Schema.Struct({
  firstName: Schema.String.check(...between(1, 100)),
  lastName: Schema.String.check(...between(1, 100)),
  username: Schema.String.check(
    ...between(1, 40),
    Schema.isPattern(/^[a-zA-Z0-9_-]+$/),
  ),
  photo: Schema.optional(Schema.String.check(Schema.isMaxLength(2048))),
  // Their t.me link, as the form sends it.
  telegram: Schema.String.check(Schema.isMaxLength(256)),
});
export type Details = typeof Details.Type;

// Earn's telegramUsernameSchema, on the username in the link.
const TelegramUsername = Schema.String.check(
  ...between(5, 32),
  Schema.isPattern(/^[a-zA-Z][a-zA-Z0-9_]*$/),
);

export class InvalidDetails extends Schema.TaggedError<InvalidDetails>()(
  'InvalidDetails',
  {},
) {
  override get message() {
    return 'Invalid user details data';
  }
}

// The photo isn't one of Earn's uploads.
export class InvalidPhoto extends Schema.TaggedError<InvalidPhoto>()(
  'InvalidPhoto',
  {},
) {
  override get message() {
    return 'Invalid photo: Image does not exist in our storage';
  }
}

// The Cloudinary public id in an upload's URL, as Earn reads it.
export function cloudinaryPublicId(url: string): string | null {
  if (!url.includes('res.cloudinary.com')) return null;
  const after = url.split('/upload/')[1];
  if (!after) return null;
  const segments = after.split('/');
  const version = segments.findIndex(
    (segment) => segment[0] === 'v' && /^\d+$/.test(segment.slice(1)),
  );
  const rest = segments.slice(version === -1 ? 0 : version + 1).join('/');
  const dot = rest.lastIndexOf('.');
  return dot === -1 ? rest : rest.slice(0, dot);
}

// Cloudinary's answer for a missing resource.
const notFound = (cause: unknown): boolean => {
  if (!cause || typeof cause !== 'object') return false;
  if ('http_code' in cause && cause.http_code === 404) return true;
  return 'error' in cause && notFound(cause.error);
};

export class SponsorMemberDetails extends Context.Service<
  SponsorMemberDetails,
  {
    // Saves them, as Earn's /api/sponsors/usersponsor-details did.
    readonly complete: (
      userId: string,
      details: Details,
    ) => Effect.Effect<
      void,
      InvalidDetails | InvalidPhoto | Database.DatabaseError
    >;
  }
>()('earn/SponsorMemberDetails') {}

const make = Effect.gen(function* () {
  const database = yield* Database.Database;
  const config = yield* AppConfig.AppConfig;

  // true: it's there; false: Cloudinary says it isn't; None: couldn't ask.
  const photoExists = (url: string) => {
    if (URL.parse(url)?.hostname === 'lh3.googleusercontent.com') {
      return Effect.succeedSome(true);
    }
    const publicId = cloudinaryPublicId(url);
    if (!publicId) return Effect.succeedSome(false);
    const account = config.cloudinary;
    if (!account) return Effect.succeed(Option.none<boolean>());
    return Effect.tryPromise(() =>
      cloudinary.api.resource(publicId, {
        resource_type: 'image',
        cloud_name: account.cloudName,
        api_key: account.apiKey,
        api_secret: Redacted.value(account.apiSecret),
      }),
    ).pipe(
      Effect.as(Option.some(true)),
      Effect.catch((error) =>
        Effect.succeed(
          notFound(error.cause) ? Option.some(false) : Option.none<boolean>(),
        ),
      ),
    );
  };

  const complete = Effect.fn('SponsorMemberDetails.complete')(function* (
    userId: string,
    details: Details,
  ) {
    let photo = details.photo;
    if (photo) {
      const exists = yield* photoExists(photo);
      if (Option.isSome(exists) && !exists.value) {
        return yield* new InvalidPhoto();
      }
      if (Option.isNone(exists)) {
        // Cloudinary couldn't say: keep the photo they had.
        const existing = yield* database.query('userPhoto', (client) =>
          client.user.findUnique({
            where: { id: userId },
            select: { photo: true },
          }),
        );
        photo = existing?.photo ?? undefined;
      }
    }
    const telegram = details.telegram.trim().match(TELEGRAM_LINK)?.[1];
    if (!telegram || !Schema.is(TelegramUsername)(telegram)) {
      return yield* new InvalidDetails();
    }
    return yield* database
      .query('completeSponsorMember', (client) =>
        client.user.update({
          where: { id: userId },
          data: {
            firstName: details.firstName,
            lastName: details.lastName,
            username: details.username,
            photo,
            telegram: `https://t.me/${telegram}`,
          },
        }),
      )
      .pipe(Effect.asVoid);
  });

  return SponsorMemberDetails.of({ complete });
});

export const layer = Layer.effect(SponsorMemberDetails, make);
