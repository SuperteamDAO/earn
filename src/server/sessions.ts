import 'server-only';

import * as Clock from 'effect/Clock';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as Redacted from 'effect/Redacted';
import * as Schema from 'effect/Schema';
import {
  errors,
  importSPKI,
  jwtVerify,
  SignJWT,
  type CryptoKey,
  type JWTVerifyOptions,
} from 'jose';

import * as AppConfig from '@/server/app-config';

export interface Session {
  readonly userId: string;
  // When Privy last vouched for them, in milliseconds, as dated in Earn's
  // own session cookie. null when only Privy's hour-long token holds them,
  // so the page should have that cookie issued now.
  readonly confirmedAt: number | null;
}

// Reads one of the request's cookies by name.
export type CookieReader = (name: string) => string | undefined;

export class Sessions extends Context.Service<
  Sessions,
  {
    // Who sent the request: Earn's own session cookie, or until one is
    // issued, Privy's access token. Both are verified; nothing else counts.
    readonly current: (
      cookie: CookieReader,
    ) => Effect.Effect<Option.Option<Session>>;
    // Earn's own session for whoever holds this Privy access token, as a
    // Set-Cookie value. None if the token isn't genuine.
    readonly begin: (
      accessToken: string,
    ) => Effect.Effect<Option.Option<string>>;
    // The Set-Cookie value that ends it.
    readonly endCookie: string;
    readonly signInEmail: (
      identityToken: string,
      userId: string,
    ) => Effect.Effect<Option.Option<string>>;
    // The address of their Privy-made Solana wallet, from the same signed
    // identity token.
    readonly solanaWallet: (
      identityToken: string,
      userId: string,
    ) => Effect.Effect<Option.Option<string>>;
  }
>()('earn/Sessions') {}

// Access and identity tokens share key, issuer and audience, so only their
// claims stop an identity token in `privy-token` from passing as a session.
const AccessClaims = Schema.Struct({
  sub: Schema.String,
  sid: Schema.String,
  iat: Schema.Finite,
  exp: Schema.Finite,
  linked_accounts: Schema.optionalKey(Schema.Undefined),
});

const IdentityClaims = Schema.Struct({
  sub: Schema.String,
  linked_accounts: Schema.String,
});

const OwnClaims = Schema.Struct({
  sub: Schema.String,
  iat: Schema.Finite,
});

const LinkedAccounts = Schema.fromJsonString(Schema.Array(Schema.Unknown));

// Privy's own (embedded) Solana wallet, as identity tokens list it.
const SolanaWallet = Schema.Struct({
  type: Schema.Literal('wallet'),
  chain_type: Schema.Literal('solana'),
  wallet_client_type: Schema.Literal('privy'),
  address: Schema.String.check(
    Schema.makeFilter((value) => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value)),
  ),
});

const EmailAccount = Schema.Union([
  Schema.Struct({ type: Schema.Literal('email'), address: Schema.String }),
  Schema.Struct({ type: Schema.Literal('google_oauth'), email: Schema.String }),
]);

// Earn's session lasts as long as Privy's own session cookies, 30 days,
// counted from when Privy last vouched. Pages ask Privy again once it's an
// hour old (see SessionKeeper), which moves both on.
const LASTS_S = 30 * 24 * 60 * 60;
const ISSUER = 'earn';
const AUDIENCE = 'earn:session';

// jose throws JOSEError for any bad, expired or forged token; anything else
// is a bug and stays a defect.
const verify = <A>(
  token: string,
  key: CryptoKey | Uint8Array,
  options: JWTVerifyOptions,
  claims: Schema.Codec<A, unknown>,
) =>
  Effect.promise(() =>
    jwtVerify(token, key, {
      ...options,
      requiredClaims: ['sub', 'iat', 'exp'],
    }).then(
      ({ payload }) => Schema.decodeOption(claims)(payload),
      (error: unknown) => {
        if (error instanceof errors.JOSEError) return Option.none<A>();
        throw error;
      },
    ),
  );

const make = Effect.gen(function* () {
  const config = yield* AppConfig.AppConfig;
  // A bad key fails at startup rather than quietly rejecting every token.
  const privyKey = yield* Effect.promise(() =>
    importSPKI(config.privy.verificationKey, 'ES256'),
  );
  const ownKey = new TextEncoder().encode(Redacted.value(config.sessionSecret));

  // HttpOnly, so no script can read it. Lax where Privy's are Strict, so
  // following a link from another site arrives signed in; writes still need
  // Earn's own Origin. In production, __Host- stops any subdomain from
  // setting or replacing it.
  const cookieName = config.isProduction
    ? '__Host-earn-session'
    : 'earn-session';
  const setCookie = (value: string, maxAge: number) =>
    [
      `${cookieName}=${value}`,
      'Path=/',
      `Max-Age=${maxAge}`,
      'HttpOnly',
      'SameSite=Lax',
      ...(config.isProduction ? ['Secure'] : []),
    ].join('; ');

  const fromPrivy = <A>(token: string, claims: Schema.Codec<A, unknown>) =>
    verify(
      token,
      privyKey,
      {
        issuer: 'privy.io',
        audience: config.privy.appId,
        algorithms: ['ES256'],
      },
      claims,
    );

  const fromOwn = (token: string) =>
    verify(
      token,
      ownKey,
      {
        issuer: ISSUER,
        audience: AUDIENCE,
        algorithms: ['HS256'],
        // Even one signed with the secret: never dated ahead of now, never
        // older than a session lasts.
        maxTokenAge: LASTS_S,
        // Allowing a minute either way, so a server whose clock runs a
        // little behind the one that issued it still takes a fresh cookie.
        clockTolerance: 60,
      },
      OwnClaims,
    );

  const current = Effect.fn('Sessions.current')(function* (
    cookie: CookieReader,
  ) {
    const ownToken = cookie(cookieName);
    const privyToken = cookie('privy-token');
    const [own, privy] = yield* Effect.all([
      ownToken ? fromOwn(ownToken) : Effect.succeedNone,
      privyToken ? fromPrivy(privyToken, AccessClaims) : Effect.succeedNone,
    ]);
    if (Option.isSome(own)) {
      const { sub, iat } = own.value;
      // Privy names someone else: it changed who's signed in here without
      // Earn seeing it, or a cookie was planted. Trust neither; the page
      // has Privy say who it is (see `canResume`).
      if (Option.isSome(privy) && privy.value.sub !== sub) {
        return Option.none<Session>();
      }
      // Earn's own session decides: HttpOnly and host-only, where Privy's
      // cookie is open to scripts (and, in production, to subdomains). It
      // lasts past Privy's hour, and Lax, it comes along on a link from
      // another site, which sends none of Privy's SameSite=Strict cookies.
      return Option.some<Session>({ userId: sub, confirmedAt: iat * 1000 });
    }
    // Privy's token stands in until one is issued: just after sign-in, or
    // in a browser that has none yet.
    return Option.map(privy, ({ sub }): Session => ({
      userId: sub,
      confirmedAt: null,
    }));
  });

  const begin = Effect.fn('Sessions.begin')(function* (accessToken: string) {
    const claims = yield* fromPrivy(accessToken, AccessClaims);
    if (Option.isNone(claims)) return Option.none<string>();
    const now = Math.floor((yield* Clock.currentTimeMillis) / 1000);
    // Dated from Privy's token rather than now: that's when Privy vouched.
    // Never from later than now, whatever the token says.
    const iat = Math.min(claims.value.iat, now);
    const { sub } = claims.value;
    const exp = iat + LASTS_S;
    const token = yield* Effect.promise(() =>
      new SignJWT({})
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuer(ISSUER)
        .setAudience(AUDIENCE)
        .setSubject(sub)
        .setIssuedAt(iat)
        .setExpirationTime(exp)
        .sign(ownKey),
    );
    return Option.some(setCookie(token, Math.max(exp - now, 0)));
  });

  const signInEmail = Effect.fn('Sessions.signInEmail')(function* (
    identityToken: string,
    userId: string,
  ) {
    const claims = yield* fromPrivy(identityToken, IdentityClaims);
    if (Option.isNone(claims) || claims.value.sub !== userId) {
      return Option.none<string>();
    }
    const accounts = Schema.decodeOption(LinkedAccounts)(
      claims.value.linked_accounts,
    ).pipe(Option.getOrElse(() => []));
    for (const account of accounts) {
      const email = Schema.decodeUnknownOption(EmailAccount)(account);
      if (Option.isSome(email)) {
        return Option.some(
          email.value.type === 'email'
            ? email.value.address
            : email.value.email,
        );
      }
    }
    return Option.none<string>();
  });

  const solanaWallet = Effect.fn('Sessions.solanaWallet')(function* (
    identityToken: string,
    userId: string,
  ) {
    const claims = yield* fromPrivy(identityToken, IdentityClaims);
    if (Option.isNone(claims) || claims.value.sub !== userId) {
      return Option.none<string>();
    }
    const accounts = Schema.decodeOption(LinkedAccounts)(
      claims.value.linked_accounts,
    ).pipe(Option.getOrElse(() => []));
    for (const account of accounts) {
      const wallet = Schema.decodeUnknownOption(SolanaWallet)(account);
      if (Option.isSome(wallet)) return Option.some(wallet.value.address);
    }
    return Option.none<string>();
  });

  return Sessions.of({
    current,
    begin,
    endCookie: setCookie('', 0),
    signInEmail,
    solanaWallet,
  });
});

export const layer = Layer.effect(Sessions, make);
