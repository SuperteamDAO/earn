import { assert, describe, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Redacted from 'effect/Redacted';
import { createHmac } from 'node:crypto';
import { Webhook } from 'svix';

import * as AppConfig from '@/server/app-config';
import * as Database from '@/server/database';
import * as EmailPreferences from '@/server/email-preferences';
import { testConfig } from '@/server/test-config';

const UNSUB_SECRET = 'unsub-secret';
const WEBHOOK_SECRET = `whsec_${Buffer.from('webhook-secret-0123456789').toString('base64')}`;

const config = AppConfig.AppConfig.of({
  ...testConfig,
  unsubscribeSecret: Redacted.make(UNSUB_SECRET),
  resend: {
    apiKey: Redacted.make('re_test'),
    replyTo: undefined,
    webhookSecret: Redacted.make(WEBHOOK_SECRET),
  },
});

interface Options {
  readonly unsubscribed?: boolean;
  readonly history?: ReadonlyArray<string>;
}

// A stand-in for Prisma: only the calls this service makes, recorded.
const fakeDatabase = (options: Options = {}) => {
  const calls: Array<{ call: string; args: unknown }> = [];
  const record =
    <A>(call: string, result: A) =>
    async (args: unknown) => {
      calls.push({ call, args });
      return result;
    };
  const client = {
    unsubscribedEmail: {
      findUnique: async () =>
        options.unsubscribed ? { id: 'x', email: 'a@b.co' } : null,
      create: record('unsubscribedEmail.create', {}),
    },
    emailSettings: { deleteMany: record('emailSettings.deleteMany', {}) },
    blockedEmail: { upsert: record('blockedEmail.upsert', {}) },
    resendLogs: {
      findMany: async () =>
        (options.history ?? []).map((status) => ({ status })),
      create: record('resendLogs.create', {}),
    },
  };
  const layer = Layer.succeed(
    Database.Database,
    Database.Database.of({
      query: (_operation, run) => Effect.promise(() => run(client as never)),
    }),
  );
  return { calls, layer };
};

const run = <A, E>(
  effect: (
    preferences: EmailPreferences.EmailPreferences['Service'],
  ) => Effect.Effect<A, E>,
  database: ReturnType<typeof fakeDatabase>,
  appConfig = config,
) =>
  EmailPreferences.EmailPreferences.use(effect).pipe(
    Effect.provide(
      EmailPreferences.layer.pipe(
        Layer.provide(database.layer),
        Layer.provide(Layer.succeed(AppConfig.AppConfig, appConfig)),
      ),
    ),
  );

const sign = (email: string) =>
  createHmac('sha256', UNSUB_SECRET).update(email).digest('hex');

const names = (calls: ReadonlyArray<{ call: string }>) =>
  calls.map(({ call }) => call);

describe('EmailPreferences.unsubscribe', () => {
  it.effect('unsubscribes a signed, lowercased address', () =>
    Effect.gen(function* () {
      const database = fakeDatabase();
      const done = yield* run(
        (p) => p.unsubscribe('Ada@Example.com', sign('ada@example.com')),
        database,
      );
      assert.isTrue(done);
      assert.deepStrictEqual(names(database.calls), [
        'unsubscribedEmail.create',
        'emailSettings.deleteMany',
      ]);
      assert.deepStrictEqual(database.calls[0]?.args, {
        data: { email: 'ada@example.com' },
      });
    }),
  );

  it.effect('refuses a wrong signature and writes nothing', () =>
    Effect.gen(function* () {
      const database = fakeDatabase();
      const error = yield* run(
        (p) => p.unsubscribe('ada@example.com', sign('eve@example.com')),
        database,
      ).pipe(Effect.flip);
      assert.strictEqual(error._tag, 'BadSignature');
      assert.deepStrictEqual(database.calls, []);
    }),
  );

  it.effect('reports an address that already unsubscribed', () =>
    Effect.gen(function* () {
      const database = fakeDatabase({ unsubscribed: true });
      const done = yield* run(
        (p) => p.unsubscribe('ada@example.com', sign('ada@example.com')),
        database,
      );
      assert.isFalse(done);
      assert.deepStrictEqual(database.calls, []);
    }),
  );

  it.effect('refuses every link without a secret', () =>
    Effect.gen(function* () {
      const error = yield* run(
        (p) => p.unsubscribe('ada@example.com', sign('ada@example.com')),
        fakeDatabase(),
        { ...config, unsubscribeSecret: undefined },
      ).pipe(Effect.flip);
      assert.strictEqual(error._tag, 'NotConfigured');
    }),
  );
});

const event = (type: string, to: ReadonlyArray<string> = ['Ada@Example.com']) =>
  JSON.stringify({
    type,
    created_at: '2026-10-26T00:00:00Z',
    data: { subject: 'Hello', to, email_id: 'e1', from: 'x@y.z' },
  });

const signed = (payload: string, secret = WEBHOOK_SECRET) => {
  const timestamp = new Date();
  return {
    'svix-id': 'msg_1',
    'svix-timestamp': String(Math.floor(timestamp.getTime() / 1000)),
    'svix-signature': new Webhook(secret).sign('msg_1', timestamp, payload),
  };
};

describe('EmailPreferences.recordDelivery', () => {
  it.effect('logs a delivery for the lowercased recipient', () =>
    Effect.gen(function* () {
      const database = fakeDatabase();
      const payload = event('email.delivered');
      yield* run((p) => p.recordDelivery(payload, signed(payload)), database);
      assert.deepStrictEqual(names(database.calls), ['resendLogs.create']);
      assert.deepStrictEqual(database.calls[0]?.args, {
        data: {
          email: 'ada@example.com',
          subject: 'Hello',
          status: 'email.delivered',
        },
      });
    }),
  );

  it.effect('refuses an event not signed with the secret', () =>
    Effect.gen(function* () {
      const database = fakeDatabase();
      const payload = event('email.complained');
      const forged = `whsec_${Buffer.from('another-secret-0123456789').toString('base64')}`;
      const error = yield* run(
        (p) => p.recordDelivery(payload, signed(payload, forged)),
        database,
      ).pipe(Effect.flip);
      assert.strictEqual(error._tag, 'BadSignature');
      assert.deepStrictEqual(database.calls, []);
    }),
  );

  it.effect('refuses an event with no recipient', () =>
    Effect.gen(function* () {
      const payload = event('email.delivered', []);
      const error = yield* run(
        (p) => p.recordDelivery(payload, signed(payload)),
        fakeDatabase(),
      ).pipe(Effect.flip);
      assert.strictEqual(error._tag, 'NoRecipient');
    }),
  );

  it.effect('stops all email after a complaint', () =>
    Effect.gen(function* () {
      const database = fakeDatabase();
      const payload = event('email.complained');
      yield* run((p) => p.recordDelivery(payload, signed(payload)), database);
      assert.deepStrictEqual(names(database.calls), [
        'emailSettings.deleteMany',
        'resendLogs.create',
      ]);
    }),
  );

  it.effect('keeps email after a lone bounce from a valid address', () =>
    Effect.gen(function* () {
      const database = fakeDatabase({
        history: ['email.delivered', 'email.delivered', 'email.bounced'],
      });
      const payload = event('email.bounced');
      yield* run((p) => p.recordDelivery(payload, signed(payload)), database);
      assert.deepStrictEqual(names(database.calls), ['resendLogs.create']);
    }),
  );

  it.effect('stops email after three bounces in a row', () =>
    Effect.gen(function* () {
      const database = fakeDatabase({
        history: ['email.bounced', 'email.bounced', 'email.bounced'],
      });
      const payload = event('email.bounced');
      yield* run((p) => p.recordDelivery(payload, signed(payload)), database);
      assert.deepStrictEqual(names(database.calls), [
        'emailSettings.deleteMany',
        'resendLogs.create',
      ]);
    }),
  );
});

const logs = (...statuses: Array<string>) =>
  statuses.map((status) => ({ status }));

describe('shouldStopAfterBounce', () => {
  it('stops on mostly bounces or six failures', () => {
    assert.isTrue(
      EmailPreferences.shouldStopAfterBounce(
        logs(
          'email.delivered',
          'email.bounced',
          'email.bounced',
          'email.bounced',
          'email.bounced',
          'email.delivered',
        ),
      ),
    );
    assert.isTrue(
      EmailPreferences.shouldStopAfterBounce(
        logs(...Array.from({ length: 6 }, () => 'email.delivery_delayed')),
      ),
    );
  });

  it('keeps a mostly delivered history', () => {
    assert.isFalse(
      EmailPreferences.shouldStopAfterBounce(
        logs(
          'email.bounced',
          'email.delivered',
          'email.delivered',
          'email.bounced',
          'email.delivered',
          'email.delivered',
        ),
      ),
    );
  });
});
