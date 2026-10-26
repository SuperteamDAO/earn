import 'server-only';

import * as Config from 'effect/Config';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as Redacted from 'effect/Redacted';
import * as Schema from 'effect/Schema';

// Every setting Earn reads, read once, here. Nothing else on the server
// reads `process.env` (client code reads `NEXT_PUBLIC_*` through
// src/lib/public-env.ts). An integration whose settings are missing is
// undefined, and the service using it skips or refuses its work.
export class AppConfig extends Context.Service<
  AppConfig,
  {
    readonly isProduction: boolean;
    // Earn's production deployment (VERCEL_ENV): picks the foundation's live
    // Airtable payment category, Cloudinary folders and the like.
    readonly earnProduction: boolean;
    readonly databaseUrl: Redacted.Redacted;
    // superteam.fun, or wherever this deployment answers.
    readonly siteUrl: string;
    // The origins Earn's own pages post from. Writes from anywhere else are
    // refused.
    readonly siteOrigins: ReadonlyArray<string>;
    readonly privy: {
      readonly appId: string;
      // A dedicated app client, so Privy's cookies can be HttpOnly. Optional:
      // without one Privy falls back to the app's defaults.
      readonly clientId: string | undefined;
      // Sign-out needs the exact Domain of Privy's cookies to delete them.
      readonly cookieDomain: string | undefined;
      readonly verificationKey: string;
      // Privy's server API (looking people up by id or email).
      readonly appSecret: Redacted.Redacted | undefined;
    };
    // Signs Earn's own session cookie. Changing it signs everyone out of
    // Earn (not Privy); their next visit issues a new one.
    readonly sessionSecret: Redacted.Redacted;
    // AI drafting in the listing builder (OpenRouter).
    readonly openRouterApiKey: Redacted.Redacted | undefined;
    readonly jupiterApiKey: Redacted.Redacted | undefined;
    readonly solana: {
      // Host of Earn's RPC (Helius), without the scheme, as Earn stores it.
      readonly rpcHost: string | undefined;
      // mainnet-beta or devnet, for payments.
      readonly paymentCluster: string | undefined;
      // Pays withdrawals' network fees, so talent need no SOL. A hot key.
      readonly feePayerKey: Redacted.Redacted | undefined;
    };
    // Earn's BullMQ queues: logicQueue (emails, for earn-emails) and
    // agentLogicQueue (for earn-agent).
    readonly emailQueueUrl: Redacted.Redacted | undefined;
    readonly agentQueueUrl: Redacted.Redacted | undefined;
    // Upstash Redis: locks and rate limits.
    readonly upstash:
      | { readonly url: string; readonly token: Redacted.Redacted }
      | undefined;
    readonly airtable: Airtable | undefined;
    readonly sumsub: Sumsub | undefined;
    readonly cloudinary: Cloudinary | undefined;
    // X sign-in (OAuth 2.0), to verify talent's X accounts.
    readonly x: OAuthClient | undefined;
    // X's API, to read tweets' stats.
    readonly xBearerToken: Redacted.Redacted | undefined;
    // A Google account that writes sponsors' exports to Sheets.
    readonly sheets:
      | (OAuthClient & {
          readonly refreshToken: Redacted.Redacted;
          readonly folderId: string | undefined;
        })
      | undefined;
    readonly resend:
      | {
          readonly apiKey: Redacted.Redacted;
          readonly replyTo: string | undefined;
          // Verifies Resend's webhooks (Svix).
          readonly webhookSecret: Redacted.Redacted | undefined;
        }
      | undefined;
    // Signs the unsubscribe links earn-emails puts in emails.
    readonly unsubscribeSecret: Redacted.Redacted | undefined;
    readonly zeroBounceApiKey: Redacted.Redacted | undefined;
    // earncognito's protected endpoints (Telegram, Discord, moderation).
    readonly earncognito:
      | { readonly url: string; readonly secret: Redacted.Redacted }
      | undefined;
  }
>()('earn/AppConfig') {}

export interface Airtable {
  readonly token: Redacted.Redacted;
  // Earn's own base (sponsors, users, listings).
  readonly base: string | undefined;
  readonly grantsBase: string | undefined;
  readonly grantsTable: string | undefined;
  readonly grantsRegionsTable: string | undefined;
  readonly recipientsTable: string | undefined;
  readonly paymentsBase: string | undefined;
  readonly paymentsTable: string | undefined;
  readonly paymentsRegionsTable: string | undefined;
  readonly perksTable: string | undefined;
  readonly gdpBase: string | undefined;
  readonly gdpSponsorsTable: string | undefined;
}

interface Sumsub {
  readonly appToken: Redacted.Redacted;
  readonly secretKey: Redacted.Redacted;
  readonly levelName: string | undefined;
}

interface Cloudinary {
  readonly cloudName: string;
  readonly apiKey: string;
  readonly apiSecret: Redacted.Redacted;
  readonly submissionsFolder: string | undefined;
}

interface OAuthClient {
  readonly clientId: string;
  readonly clientSecret: Redacted.Redacted;
}

// Long enough to sign with: 32 random bytes encode to 43 or more characters.
const SessionSecret = Schema.Redacted(
  Schema.String.check(
    Schema.makeFilter(
      (value) => value.length >= 32 || 'must be at least 32 random characters',
    ),
  ),
);

// An optional secret; blank counts as unset.
const optionalSecret = (name: string) =>
  Config.option(Config.Redacted(name)).pipe(
    Config.map(Option.getOrUndefined),
    Config.map((value) =>
      value && Redacted.value(value).trim() ? value : undefined,
    ),
  );

// An optional setting; blank counts as unset.
const text = (name: string) =>
  Config.option(Config.String(name)).pipe(
    Config.map(Option.getOrUndefined),
    Config.map((value) => value?.trim() || undefined),
  );

const make = Effect.gen(function* () {
  const isProduction =
    (yield* Config.String('NODE_ENV').pipe(Config.withDefault(''))) ===
    'production';

  const siteUrl =
    (yield* text('NEXT_PUBLIC_SITE_URL')) ?? 'http://localhost:3000';
  const siteOrigin = URL.parse(siteUrl)?.origin;
  if (isProduction && !siteOrigin) {
    return yield* Effect.die(
      new Error(
        'NEXT_PUBLIC_SITE_URL must be a URL like https://superteam.fun',
      ),
    );
  }

  const upstashUrl = yield* text('UPSTASH_REDIS_REST_URL');
  const upstashToken = yield* optionalSecret('UPSTASH_REDIS_REST_TOKEN');
  const airtableToken = yield* optionalSecret('AIRTABLE_API_TOKEN');
  const sumsubToken = yield* optionalSecret('SUMSUB_API_KEY');
  const sumsubSecret = yield* optionalSecret('SUMSUB_SECRET_KEY');
  const cloudName = yield* text('CLOUDINARY_CLOUD_NAME');
  const cloudinaryKey = yield* text('CLOUDINARY_API_KEY');
  const cloudinarySecret = yield* optionalSecret('CLOUDINARY_API_SECRET');
  const xClientId = yield* text('TWITTER_CLIENT_ID');
  const xClientSecret = yield* optionalSecret('TWITTER_CLIENT_SECRET');
  const sheetsClientId = yield* text('GA_LISTINGS_SHEET_CLIENT_ID');
  const sheetsClientSecret = yield* optionalSecret(
    'GA_LISTINGS_SHEET_CLIENT_SECRET',
  );
  const sheetsRefreshToken = yield* optionalSecret(
    'GA_LISTINGS_SHEET_REFRESH_TOKEN',
  );
  const resendKey = yield* optionalSecret('RESEND_API_KEY');
  const earncognitoUrl = yield* text('EARNCOGNITO_URL');
  const earncognitoSecret = yield* optionalSecret('EARNCOGNITO_SECRET');

  return AppConfig.of({
    isProduction,
    earnProduction: (yield* text('VERCEL_ENV')) === 'production',
    databaseUrl: yield* Config.Redacted('DATABASE_URL'),
    siteUrl,
    siteOrigins:
      isProduction && siteOrigin ? [siteOrigin] : ['http://localhost:3000'],
    privy: {
      appId: yield* Config.NonEmptyString('NEXT_PUBLIC_PRIVY_APP_ID'),
      clientId: yield* text('PRIVY_CLIENT_ID'),
      cookieDomain: yield* text('PRIVY_COOKIE_DOMAIN'),
      verificationKey: (yield* Config.NonEmptyString(
        'PRIVY_VERIFICATION_KEY',
      )).replaceAll('\\n', '\n'),
      appSecret: yield* optionalSecret('PRIVY_APP_SECRET'),
    },
    sessionSecret: yield* Config.schema(SessionSecret, 'SESSION_SECRET'),
    openRouterApiKey: yield* optionalSecret('OPENROUTER_API_KEY'),
    jupiterApiKey: yield* optionalSecret('JUPITER_API_KEY'),
    solana: {
      rpcHost: yield* text('NEXT_PUBLIC_RPC_URL'),
      paymentCluster: yield* text('NEXT_PUBLIC_PAYMENT_CLUSTER'),
      feePayerKey: yield* optionalSecret('FEEPAYER_PRIVATE_KEY'),
    },
    emailQueueUrl: yield* optionalSecret('REDIS_URL'),
    agentQueueUrl: yield* optionalSecret('AGENT_REDIS_URL'),
    upstash:
      upstashUrl && upstashToken
        ? { url: upstashUrl, token: upstashToken }
        : undefined,
    airtable: airtableToken
      ? {
          token: airtableToken,
          base: yield* text('AIRTABLE_BASE_ID'),
          grantsBase: yield* text('AIRTABLE_GRANTS_BASE_ID'),
          grantsTable: yield* text('AIRTABLE_GRANTS_TABLE_NAME'),
          grantsRegionsTable: yield* text('AIRTABLE_GRANTS_REGIONS_TABLE_NAME'),
          recipientsTable: yield* text('AIRTABLE_RECIPIENTS_TABLE'),
          paymentsBase: yield* text('AIRTABLE_PAYMENTS_BASE_ID'),
          paymentsTable: yield* text('AIRTABLE_PAYMENTS_TABLE_NAME'),
          paymentsRegionsTable: yield* text(
            'AIRTABLE_PAYMENTS_REGIONS_TABLE_NAME',
          ),
          perksTable: yield* text('AIRTABLE_PERKS_TABLE'),
          gdpBase: yield* text('AIRTABLE_GDP_BASE_ID'),
          gdpSponsorsTable: yield* text('AIRTABLE_GDP_SPONSORS_TABLE_NAME'),
        }
      : undefined,
    sumsub:
      sumsubToken && sumsubSecret
        ? {
            appToken: sumsubToken,
            secretKey: sumsubSecret,
            levelName: yield* text('SUMSUB_LEVEL_NAME'),
          }
        : undefined,
    cloudinary:
      cloudName && cloudinaryKey && cloudinarySecret
        ? {
            cloudName,
            apiKey: cloudinaryKey,
            apiSecret: cloudinarySecret,
            submissionsFolder: yield* text('CLOUDINARY_SUBMISSIONS_FOLDER'),
          }
        : undefined,
    x:
      xClientId && xClientSecret
        ? { clientId: xClientId, clientSecret: xClientSecret }
        : undefined,
    xBearerToken:
      (yield* optionalSecret('X_BEARER_TOKEN')) ??
      (yield* optionalSecret('TWITTER_BEARER_TOKEN')),
    sheets:
      sheetsClientId && sheetsClientSecret && sheetsRefreshToken
        ? {
            clientId: sheetsClientId,
            clientSecret: sheetsClientSecret,
            refreshToken: sheetsRefreshToken,
            folderId: yield* text('GA_LISTINGS_SHEET_PARENT_FOLDER_ID'),
          }
        : undefined,
    resend: resendKey
      ? {
          apiKey: resendKey,
          replyTo: yield* text('REPLY_TO_EMAIL'),
          webhookSecret: yield* optionalSecret('WEBHOOK_SECRET'),
        }
      : undefined,
    unsubscribeSecret: yield* optionalSecret('UNSUB_SECRET'),
    zeroBounceApiKey: yield* optionalSecret('ZEROBOUNCE_API_KEY'),
    earncognito:
      earncognitoUrl && earncognitoSecret
        ? { url: earncognitoUrl, secret: earncognitoSecret }
        : undefined,
  });
});

export const layer = Layer.effect(AppConfig, make);
