import 'server-only';

import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import * as Schema from 'effect/Schema';
import { NextResponse, type NextRequest } from 'next/server';

import * as AppConfig from '@/server/app-config';
import * as Sessions from '@/server/sessions';
import * as Users from '@/server/users';

export const json = (status: number, body: unknown) =>
  NextResponse.json(body, { status });

// Whether the request came from Earn's own pages: its Origin, exactly.
// Browsers send it on every POST, so a missing one is refused too.
export const fromEarn = Effect.fn('fromEarn')(function* (request: NextRequest) {
  const config = yield* AppConfig.AppConfig;
  return config.siteOrigins.includes(request.headers.get('origin') ?? '');
});

// Who sent a request, by its session cookie; for reads that change with
// the viewer. None when signed out.
export const sessionOf = (request: NextRequest) =>
  Sessions.Sessions.use((sessions) =>
    sessions.current((name) => request.cookies.get(name)?.value),
  ).pipe(Effect.map(Option.map((session) => session.userId)));

// The first step of every route that writes: the request must come from
// Earn's own pages and carry a valid session. Resolves to the Privy user
// id, or to the response that refuses the request.
export const guardWrite = Effect.fn('guardWrite')(function* (
  request: NextRequest,
) {
  if (!(yield* fromEarn(request))) return json(403, { error: 'origin' });
  const privyDid = yield* sessionOf(request);
  if (Option.isNone(privyDid)) return json(401, { error: 'session' });
  return privyDid.value;
});

const refuse = {
  NoAccount: () => Effect.succeed(json(403, { error: 'account' })),
  Blocked: () => Effect.succeed(json(403, { error: 'blocked' })),
  NoSponsor: () => Effect.succeed(json(403, { error: 'sponsor' })),
  DatabaseError: () => Effect.succeed(json(500, { error: 'database' })),
} as const;

// guardWrite, then an Earn account that isn't blocked (Earn's
// getUserSession).
export const guardUser = Effect.fn('guardUser')(function* (
  request: NextRequest,
) {
  const privyDid = yield* guardWrite(request);
  if (typeof privyDid !== 'string') return privyDid;
  return yield* Users.Users.use((users) => users.writer(privyDid)).pipe(
    Effect.catchTags({
      NoAccount: refuse.NoAccount,
      Blocked: refuse.Blocked,
      DatabaseError: refuse.DatabaseError,
    }),
  );
});

// guardWrite, then an account acting for its current sponsor (Earn's
// getSponsorSession).
export const guardSponsor = Effect.fn('guardSponsor')(function* (
  request: NextRequest,
) {
  const privyDid = yield* guardWrite(request);
  if (typeof privyDid !== 'string') return privyDid;
  return yield* Users.Users.use((users) => users.sponsorWriter(privyDid)).pipe(
    Effect.catchTags(refuse),
  );
});

// The same checks for reads that only a signed-in account or sponsor may
// make (GET, so no Origin): exports, private lists.
export const readerUser = Effect.fn('readerUser')(function* (
  request: NextRequest,
) {
  const privyDid = yield* sessionOf(request);
  if (Option.isNone(privyDid)) return json(401, { error: 'session' });
  return yield* Users.Users.use((users) => users.writer(privyDid.value)).pipe(
    Effect.catchTags({
      NoAccount: refuse.NoAccount,
      Blocked: refuse.Blocked,
      DatabaseError: refuse.DatabaseError,
    }),
  );
});

export const readerSponsor = Effect.fn('readerSponsor')(function* (
  request: NextRequest,
) {
  const privyDid = yield* sessionOf(request);
  if (Option.isNone(privyDid)) return json(401, { error: 'session' });
  return yield* Users.Users.use((users) =>
    users.sponsorWriter(privyDid.value),
  ).pipe(Effect.catchTags(refuse));
});

// Write bodies are small (a listing's description is the largest);
// anything bigger is refused.
const MAX_BODY = 256 * 1024;

export const readBody = (request: NextRequest, limit = MAX_BODY) =>
  Effect.promise(() => request.text()).pipe(
    Effect.map((text) => (text.length > limit ? null : text)),
  );

// Reads and decodes a JSON body: the value, or the response refusing it
// (413 too large, 400 malformed).
export const decodeBody = <A, I>(
  request: NextRequest,
  schema: Schema.Codec<A, I>,
  limit = MAX_BODY,
) =>
  readBody(request, limit).pipe(
    Effect.map((text) => {
      if (text === null) return json(413, { error: 'size' });
      const value = Schema.decodeOption(Schema.fromJsonString(schema))(text);
      return Option.isSome(value) ? value.value : json(400, { error: 'body' });
    }),
  );

// The caller's address, for rate limits on signed-out routes.
export const clientIp = (request: NextRequest) =>
  request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
