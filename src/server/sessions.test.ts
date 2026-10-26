import { assert, describe, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as Redacted from 'effect/Redacted';
import { TestClock } from 'effect/testing';
import { generateKeyPair, SignJWT, UnsecuredJWT } from 'jose';

import * as AppConfig from '@/server/app-config';
import * as Sessions from '@/server/sessions';
import { signToken, testConfig } from '@/server/test-config';

const layerWith = (config: typeof testConfig) =>
  Sessions.layer.pipe(
    Layer.provide(Layer.succeed(AppConfig.AppConfig, config)),
  );
const layer = layerWith(testConfig);

const DAY_S = 24 * 60 * 60;

const accessToken = (sub = 'did:privy:user', issuedAt?: number) =>
  Effect.promise(() => signToken({ sub, sid: 'sid' }, { issuedAt }));

// A request's cookies, as `current` reads them.
const jar =
  (cookies: Record<string, string>): Sessions.CookieReader =>
  (name) =>
    cookies[name];

// What a Set-Cookie value sets.
function parse(setCookie: string) {
  const [pair = '', ...attributes] = setCookie.split('; ');
  const at = pair.indexOf('=');
  return { name: pair.slice(0, at), value: pair.slice(at + 1), attributes };
}

// Begins a session as /account/session does, by the real clock.
const begun = (token: string) =>
  Effect.gen(function* () {
    yield* TestClock.setTime(Date.now());
    const sessions = yield* Sessions.Sessions;
    return parse(Option.getOrThrow(yield* sessions.begin(token)));
  });

const userOf = (session: Option.Option<Sessions.Session>) =>
  Option.map(session, ({ userId }) => userId);

describe('Sessions.current', () => {
  it.effect('trusts a genuine Privy access token', () =>
    Effect.gen(function* () {
      const sessions = yield* Sessions.Sessions;
      const session = yield* sessions.current(
        jar({ 'privy-token': yield* accessToken() }),
      );
      assert.deepStrictEqual(
        session,
        Option.some({ userId: 'did:privy:user', confirmedAt: null }),
      );
    }).pipe(Effect.provide(layer)),
  );

  it.effect('rejects an identity token used as an access token', () =>
    Effect.gen(function* () {
      const sessions = yield* Sessions.Sessions;
      const token = yield* Effect.promise(() =>
        signToken({ sub: 'did:privy:user', sid: 'x', linked_accounts: '[]' }),
      );
      assert.isTrue(
        Option.isNone(yield* sessions.current(jar({ 'privy-token': token }))),
      );
    }).pipe(Effect.provide(layer)),
  );

  it.effect('rejects tokens for another app or from another key', () =>
    Effect.gen(function* () {
      const sessions = yield* Sessions.Sessions;
      const { privateKey } = yield* Effect.promise(() =>
        generateKeyPair('ES256'),
      );
      const claims = { sub: 'did:privy:user', sid: 'x' };
      const otherApp = yield* Effect.promise(() =>
        signToken(claims, { audience: 'other-app' }),
      );
      const forged = yield* Effect.promise(() =>
        signToken(claims, { key: privateKey }),
      );
      for (const token of [otherApp, forged, 'not-a-jwt', '']) {
        assert.isTrue(
          Option.isNone(yield* sessions.current(jar({ 'privy-token': token }))),
        );
      }
    }).pipe(Effect.provide(layer)),
  );

  it.effect('keeps them signed in once Privy’s token is gone', () =>
    Effect.gen(function* () {
      const sessions = yield* Sessions.Sessions;
      const iat = Math.floor(Date.now() / 1000) - 50 * 60;
      const cookie = yield* begun(yield* accessToken('did:privy:user', iat));
      const session = yield* sessions.current(
        jar({ [cookie.name]: cookie.value }),
      );
      // Dated from when Privy vouched, so pages know to ask again soon.
      assert.deepStrictEqual(
        session,
        Option.some({ userId: 'did:privy:user', confirmedAt: iat * 1000 }),
      );
    }).pipe(Effect.provide(layer)),
  );

  it.effect('trusts neither when Privy names someone else', () =>
    Effect.gen(function* () {
      const sessions = yield* Sessions.Sessions;
      const cookie = yield* begun(yield* accessToken('did:privy:user'));
      const both = (privyUser: string) =>
        Effect.gen(function* () {
          return yield* sessions.current(
            jar({
              [cookie.name]: cookie.value,
              'privy-token': yield* accessToken(privyUser),
            }),
          );
        });
      // Agreeing, Earn's own session (and its date) stands.
      const same = Option.getOrThrow(yield* both('did:privy:user'));
      assert.strictEqual(same.userId, 'did:privy:user');
      assert.isNotNull(same.confirmedAt);
      // Switched, or planted: signed out until Privy says who it is.
      assert.isTrue(Option.isNone(yield* both('did:privy:someone-else')));
    }).pipe(Effect.provide(layer)),
  );

  it.effect('dates a session no later than now', () =>
    Effect.gen(function* () {
      const sessions = yield* Sessions.Sessions;
      const future = Math.floor(Date.now() / 1000) + 600;
      const token = yield* accessToken('did:privy:user', future);
      // jose takes a token issued ahead of its clock; the session doesn't.
      const cookie = yield* begun(token);
      const session = Option.getOrThrow(
        yield* sessions.current(jar({ [cookie.name]: cookie.value })),
      );
      assert.isAtMost(session.confirmedAt ?? Infinity, Date.now());
    }).pipe(Effect.provide(layer)),
  );

  it.effect('refuses a session cookie it didn’t sign', () =>
    Effect.gen(function* () {
      const sessions = yield* Sessions.Sessions;
      const now = Math.floor(Date.now() / 1000);
      const own = ({
        secret = Redacted.value(testConfig.sessionSecret),
        issuer = 'earn',
        audience = 'earn:session',
        iat = now - DAY_S,
        exp = now + DAY_S,
      }: {
        secret?: string;
        issuer?: string;
        audience?: string;
        iat?: number;
        exp?: number;
      }) =>
        Effect.promise(() =>
          new SignJWT({})
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuer(issuer)
            .setAudience(audience)
            .setSubject('did:privy:user')
            .setIssuedAt(iat)
            .setExpirationTime(exp)
            .sign(new TextEncoder().encode(secret)),
        );
      const genuine = yield* own({});
      // Issued by a server whose clock runs half a minute ahead: still good.
      const skewed = yield* own({ iat: now + 30 });
      for (const token of [genuine, skewed]) {
        assert.deepStrictEqual(
          userOf(yield* sessions.current(jar({ 'earn-session': token }))),
          Option.some('did:privy:user'),
        );
      }
      const refused = [
        yield* own({ secret: 'another-secret-0123456789abcdefghij' }),
        yield* own({ issuer: 'privy.io' }),
        yield* own({ audience: 'test-app' }),
        yield* own({ exp: now - 60 }),
        // Signed with the secret, yet dated ahead of now, or older than a
        // session lasts however late it says it runs out.
        yield* own({ iat: now + 600 }),
        yield* own({ iat: now - 31 * DAY_S, exp: now + 300 * DAY_S }),
        // Unsigned, and Privy's own token: neither is Earn's to accept.
        new UnsecuredJWT({ sub: 'did:privy:user' })
          .setIssuer('earn')
          .setAudience('earn:session')
          .setIssuedAt()
          .setExpirationTime('1d')
          .encode(),
        yield* accessToken(),
        `${genuine.slice(0, -2)}xx`,
        'not-a-jwt',
      ];
      for (const token of refused) {
        assert.isTrue(
          Option.isNone(
            yield* sessions.current(jar({ 'earn-session': token })),
          ),
        );
      }
    }).pipe(Effect.provide(layer)),
  );
});

describe('Sessions.begin', () => {
  it.effect('issues an HttpOnly, Lax cookie for 30 days', () =>
    Effect.gen(function* () {
      const cookie = yield* begun(yield* accessToken());
      assert.strictEqual(cookie.name, 'earn-session');
      const maxAge = Number(
        cookie.attributes
          .find((attribute) => attribute.startsWith('Max-Age='))
          ?.slice('Max-Age='.length),
      );
      assert.isAtLeast(maxAge, 30 * DAY_S - 60);
      assert.isAtMost(maxAge, 30 * DAY_S);
      for (const attribute of ['Path=/', 'HttpOnly', 'SameSite=Lax']) {
        assert.include(cookie.attributes, attribute);
      }
      assert.notInclude(cookie.attributes, 'Secure');
    }).pipe(Effect.provide(layer)),
  );

  it.effect('in production, keeps it to HTTPS and this host', () =>
    Effect.gen(function* () {
      const cookie = yield* begun(yield* accessToken());
      assert.strictEqual(cookie.name, '__Host-earn-session');
      assert.include(cookie.attributes, 'Secure');
      const sessions = yield* Sessions.Sessions;
      assert.strictEqual(
        sessions.endCookie,
        '__Host-earn-session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure',
      );
    }).pipe(Effect.provide(layerWith({ ...testConfig, isProduction: true }))),
  );

  it.effect('only for a genuine Privy access token', () =>
    Effect.gen(function* () {
      const sessions = yield* Sessions.Sessions;
      const { privateKey } = yield* Effect.promise(() =>
        generateKeyPair('ES256'),
      );
      const identity = yield* Effect.promise(() =>
        signToken({ sub: 'did:privy:user', sid: 'x', linked_accounts: '[]' }),
      );
      const forged = yield* Effect.promise(() =>
        signToken({ sub: 'did:privy:user', sid: 'x' }, { key: privateKey }),
      );
      for (const token of [identity, forged, 'not-a-jwt', '']) {
        assert.isTrue(Option.isNone(yield* sessions.begin(token)));
      }
    }).pipe(Effect.provide(layer)),
  );
});

const identityToken = (sub: string, linkedAccounts: string) =>
  Effect.promise(() => signToken({ sub, linked_accounts: linkedAccounts }));

describe('Sessions.signInEmail', () => {
  it.effect('reads the email or Google account, in order', () =>
    Effect.gen(function* () {
      const sessions = yield* Sessions.Sessions;
      const accounts = JSON.stringify([
        { type: 'wallet', address: '0xabc' },
        { type: 'google_oauth', email: 'g@example.com' },
        { type: 'email', address: 'e@example.com' },
      ]);
      const token = yield* identityToken('did:privy:user', accounts);
      assert.deepStrictEqual(
        yield* sessions.signInEmail(token, 'did:privy:user'),
        Option.some('g@example.com'),
      );
    }).pipe(Effect.provide(layer)),
  );

  it.effect('ignores another user’s token and malformed claims', () =>
    Effect.gen(function* () {
      const sessions = yield* Sessions.Sessions;
      const valid = JSON.stringify([
        { type: 'email', address: 'e@example.com' },
      ]);
      const otherUser = yield* identityToken('did:privy:other', valid);
      const malformed = yield* identityToken('did:privy:user', '{not json');
      const access = yield* accessToken();
      for (const token of [otherUser, malformed, access]) {
        assert.isTrue(
          Option.isNone(yield* sessions.signInEmail(token, 'did:privy:user')),
        );
      }
    }).pipe(Effect.provide(layer)),
  );
});
