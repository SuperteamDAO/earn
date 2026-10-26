import 'server-only';

import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Redacted from 'effect/Redacted';
import * as Schema from 'effect/Schema';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { Webhook } from 'svix';

import * as AppConfig from '@/server/app-config';
import * as Database from '@/server/database';

export class BadSignature extends Schema.TaggedError<BadSignature>()(
  'BadSignature',
  {},
) {
  override get message() {
    return 'Signature does not match';
  }
}

// A setting the request needs is missing (the unsubscribe or webhook
// secret).
export class NotConfigured extends Schema.TaggedError<NotConfigured>()(
  'NotConfigured',
  { setting: Schema.String },
) {
  override get message() {
    return `Not configured: ${this.setting}`;
  }
}

export class NoRecipient extends Schema.TaggedError<NoRecipient>()(
  'NoRecipient',
  {},
) {
  override get message() {
    return 'Webhook event names no recipient';
  }
}

// Resend's delivery events (Svix), as Earn reads them.
const DeliveryEvent = Schema.Struct({
  type: Schema.String,
  data: Schema.Struct({
    subject: Schema.String,
    to: Schema.Array(Schema.String),
  }),
});

// The Svix headers a webhook is signed with.
export interface SvixHeaders {
  readonly 'svix-id': string;
  readonly 'svix-timestamp': string;
  readonly 'svix-signature': string;
}

// ZeroBounce's verdict on an address.
const Verdict = Schema.Struct({
  status: Schema.optional(Schema.String),
  sub_status: Schema.optional(Schema.String),
});

// Who gets Earn's emails: the unsubscribe links earn-emails puts in every
// email (signed with the unsubscribe secret), and Resend's delivery events,
// which stop mail to addresses that bounce or complain.
export class EmailPreferences extends Context.Service<
  EmailPreferences,
  {
    // Unsubscribes an address whose link signature matches. `false` when it
    // already was.
    readonly unsubscribe: (
      email: string,
      signature: string,
    ) => Effect.Effect<
      boolean,
      BadSignature | NotConfigured | Database.DatabaseError
    >;
    // Verifies and records one of Resend's events: a bounce may block the
    // address or stop its emails, a complaint stops them, and every event
    // is logged.
    readonly recordDelivery: (
      payload: string,
      headers: SvixHeaders,
    ) => Effect.Effect<
      void,
      BadSignature | NotConfigured | NoRecipient | Database.DatabaseError
    >;
  }
>()('earn/EmailPreferences') {}

const sameHex = (a: string, b: string) => {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
};

interface DeliveryLog {
  readonly status: string;
}

// Earn's rule for stopping mail after a bounce from a valid address: the
// last three bounced, or the last six (newest first) are all failures, all
// delays, or mostly bounces.
export const shouldStopAfterBounce = (
  lastSix: ReadonlyArray<DeliveryLog>,
): boolean => {
  const bounced = lastSix.filter(
    (log) => log.status === 'email.bounced',
  ).length;
  const delayed = lastSix.filter(
    (log) => log.status === 'email.delivery_delayed',
  ).length;
  const lastThreeBounced = lastSix
    .slice(0, 3)
    .every((log) => log.status === 'email.bounced');
  return (
    lastThreeBounced ||
    bounced + delayed >= 6 ||
    delayed === 6 ||
    bounced / lastSix.length > 0.5
  );
};

const make = Effect.gen(function* () {
  const config = yield* AppConfig.AppConfig;
  const db = yield* Database.Database;

  const unsubscribe = Effect.fn('EmailPreferences.unsubscribe')(function* (
    email: string,
    signature: string,
  ) {
    const secret = config.unsubscribeSecret;
    if (!secret) return yield* new NotConfigured({ setting: 'unsubscribe' });
    const normalized = email.toLowerCase();
    const expected = createHmac('sha256', Redacted.value(secret))
      .update(normalized)
      .digest('hex');
    if (!sameHex(signature, expected)) return yield* new BadSignature();

    const existing = yield* db.query('unsubscribedEmail.find', (client) =>
      client.unsubscribedEmail.findUnique({ where: { email: normalized } }),
    );
    if (existing) return false;
    yield* db.query('unsubscribedEmail.create', (client) =>
      client.unsubscribedEmail.create({ data: { email: normalized } }),
    );
    yield* db.query('emailSettings.deleteByEmail', (client) =>
      client.emailSettings.deleteMany({
        where: { user: { email: normalized } },
      }),
    );
    return true;
  });

  const stopEmails = (email: string) =>
    db.query('emailSettings.deleteByEmail', (client) =>
      client.emailSettings.deleteMany({ where: { user: { email } } }),
    );

  // Fails open: without a key, or when ZeroBounce can't be reached, the
  // address counts as valid, so an outage never blocks anyone.
  const isValidAddress = (email: string) => {
    const key = config.zeroBounceApiKey;
    if (!key) return Effect.succeed(true);
    const url = new URL('https://api.zerobounce.net/v2/validate');
    url.searchParams.set('api_key', Redacted.value(key));
    url.searchParams.set('email', email);
    // The URL carries the key: never log the request or its error.
    return Effect.tryPromise(() =>
      fetch(url, { signal: AbortSignal.timeout(10_000) }).then(
        (response): Promise<unknown> =>
          response.ok
            ? response.json()
            : Promise.reject(new Error('ZeroBounce')),
      ),
    ).pipe(
      Effect.flatMap(Schema.decodeUnknownEffect(Verdict)),
      Effect.map(
        (verdict) =>
          verdict.status === 'valid' ||
          (verdict.status === 'do_not_mail' &&
            verdict.sub_status === 'role_based'),
      ),
      Effect.catch(() =>
        Effect.logWarning('ZeroBounce check failed; treated as valid').pipe(
          Effect.as(true),
        ),
      ),
    );
  };

  const handleBounce = Effect.fn('EmailPreferences.handleBounce')(function* (
    email: string,
  ) {
    if (!(yield* isValidAddress(email))) {
      // Already blocked is fine: Resend reports every bounce.
      yield* db.query('blockedEmail.upsert', (client) =>
        client.blockedEmail.upsert({
          where: { email },
          create: { email },
          update: {},
        }),
      );
      return;
    }
    const lastSix = yield* db.query('resendLogs.lastSix', (client) =>
      client.resendLogs.findMany({
        where: { email },
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: { status: true },
      }),
    );
    if (shouldStopAfterBounce(lastSix)) yield* stopEmails(email);
  });

  const recordDelivery = Effect.fn('EmailPreferences.recordDelivery')(
    function* (payload: string, headers: SvixHeaders) {
      const secret = config.resend?.webhookSecret;
      if (!secret) return yield* new NotConfigured({ setting: 'webhook' });
      const event = yield* Effect.try({
        try: () =>
          new Webhook(Redacted.value(secret)).verify(payload, { ...headers }),
        catch: () => new BadSignature(),
      }).pipe(
        Effect.flatMap(Schema.decodeUnknownEffect(DeliveryEvent)),
        Effect.mapError(() => new BadSignature()),
      );

      const recipient = event.data.to[0];
      if (!recipient) return yield* new NoRecipient();
      const email = recipient.toLowerCase();

      if (event.type === 'email.bounced') yield* handleBounce(email);
      else if (event.type === 'email.complained') yield* stopEmails(email);

      return yield* db
        .query('resendLogs.create', (client) =>
          client.resendLogs.create({
            data: { email, subject: event.data.subject, status: event.type },
          }),
        )
        .pipe(Effect.asVoid);
    },
  );

  return EmailPreferences.of({ unsubscribe, recordDelivery });
});

export const layer = Layer.effect(EmailPreferences, make);
