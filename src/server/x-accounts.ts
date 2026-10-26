import 'server-only';

import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as Redacted from 'effect/Redacted';
import * as Schema from 'effect/Schema';
import { createHash, randomBytes } from 'node:crypto';

import * as AppConfig from '@/server/app-config';
import * as Database from '@/server/database';

export class XRefused extends Schema.TaggedError<XRefused>()('XRefused', {
  // 'unavailable': X sign-in isn't configured; 'denied': X said no or
  // answered nonsense; 'account': no Earn account for this sign-in.
  reason: Schema.Literals(['unavailable', 'denied', 'account']),
}) {
  override get message() {
    return `X verification refused: ${this.reason}`;
  }
}

export interface Authorization {
  // Where to send them on X.
  readonly url: string;
  // Kept in a cookie until they're back: the state X echoes and the PKCE
  // verifier for the code.
  readonly state: string;
  readonly verifier: string;
}

// The path X sends them back to: the callback registered with Earn's X app
// (next-auth's, kept so the app needs no change).
export const X_CALLBACK_PATH = '/api/auth/callback/twitter';

// A handle as Earn stores it in `linkedTwitter`: no @, lower case.
export const normalizeXHandle = (handle: string) =>
  handle.replace(/^@/, '').toLowerCase().trim();

// Proves someone owns an X account by having them sign in to it (OAuth 2.0
// with PKCE), and records the handle in `User.linkedTwitter`, which
// submission and grant forms check X links against.
export class XAccounts extends Context.Service<
  XAccounts,
  {
    readonly authorize: Effect.Effect<Authorization, XRefused>;
    // Trades X's code for the account and links its handle. Succeeds with
    // the handle as stored.
    readonly link: (
      privyDid: string,
      code: string,
      verifier: string,
    ) => Effect.Effect<string, XRefused | Database.DatabaseError>;
  }
>()('earn/XAccounts') {}

const Token = Schema.Struct({ access_token: Schema.String });
const Me = Schema.Struct({
  data: Schema.Struct({ username: Schema.String }),
});
const Handles = Schema.Array(Schema.String);

const base64url = (bytes: Buffer) => bytes.toString('base64url');

const fetchJson = (url: string, init: RequestInit) =>
  Effect.tryPromise(async (): Promise<unknown> => {
    const response = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error(`X answered ${response.status}`);
    return response.json();
  }).pipe(Effect.mapError(() => new XRefused({ reason: 'denied' })));

const decodeOr = <A>(schema: Schema.ConstraintDecoder<A>) =>
  Effect.flatMap((body: unknown) =>
    Effect.fromOption(Schema.decodeUnknownOption(schema)(body)).pipe(
      Effect.mapError(() => new XRefused({ reason: 'denied' })),
    ),
  );

const make = Effect.gen(function* () {
  const config = yield* AppConfig.AppConfig;
  const database = yield* Database.Database;
  const x = config.x;
  const redirectUri = `${config.siteOrigins[0] ?? config.siteUrl}${X_CALLBACK_PATH}`;

  const authorize = Effect.suspend(() => {
    if (!x) return Effect.fail(new XRefused({ reason: 'unavailable' }));
    const state = base64url(randomBytes(24));
    const verifier = base64url(randomBytes(48));
    const challenge = base64url(createHash('sha256').update(verifier).digest());
    const url = new URL('https://x.com/i/oauth2/authorize');
    url.search = new URLSearchParams({
      response_type: 'code',
      client_id: x.clientId,
      redirect_uri: redirectUri,
      scope: 'users.read tweet.read',
      state,
      code_challenge: challenge,
      code_challenge_method: 'S256',
    }).toString();
    return Effect.succeed({ url: url.toString(), state, verifier });
  });

  const link = Effect.fn('XAccounts.link')(function* (
    privyDid: string,
    code: string,
    verifier: string,
  ) {
    if (!x) return yield* new XRefused({ reason: 'unavailable' });
    const basic = Buffer.from(
      `${x.clientId}:${Redacted.value(x.clientSecret)}`,
    ).toString('base64');
    const token = yield* fetchJson('https://api.x.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        code_verifier: verifier,
      }).toString(),
    }).pipe(decodeOr(Token));
    const me = yield* fetchJson('https://api.x.com/2/users/me', {
      headers: { Authorization: `Bearer ${token.access_token}` },
    }).pipe(decodeOr(Me));
    const handle = normalizeXHandle(me.data.username);
    if (!handle) return yield* new XRefused({ reason: 'denied' });

    // Under a lock on the user, so two tabs verifying at once both land.
    const linked = yield* database.query('linkX', (client) =>
      client.$transaction(async (tx) => {
        const locked = await tx.$queryRaw<Array<{ id: string }>>`
          SELECT id FROM \`User\` WHERE privyDid = ${privyDid} FOR UPDATE
        `;
        const id = locked[0]?.id;
        if (!id) return false;
        const user = await tx.user.findUniqueOrThrow({
          where: { id },
          select: { linkedTwitter: true },
        });
        const handles = Option.getOrElse(
          Schema.decodeUnknownOption(Handles)(user.linkedTwitter),
          (): ReadonlyArray<string> => [],
        );
        if (!handles.includes(handle)) {
          await tx.user.update({
            where: { id },
            data: { linkedTwitter: [...handles, handle] },
          });
        }
        return true;
      }),
    );
    if (!linked) return yield* new XRefused({ reason: 'account' });
    return handle;
  });

  return XAccounts.of({ authorize, link });
});

export const layer = Layer.effect(XAccounts, make);
