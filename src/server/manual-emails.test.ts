import { assert, describe, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import * as AppConfig from '@/server/app-config';
import * as Database from '@/server/database';
import * as ManualEmails from '@/server/manual-emails';
import * as RateLimits from '@/server/rate-limits';
import { testConfig } from '@/server/test-config';

// Rate limits that record what they counted, refusing `refuse`.
const fakeLimits = (refuse?: string) => {
  const counted: Array<string> = [];
  const layer = Layer.succeed(
    RateLimits.RateLimits,
    RateLimits.RateLimits.of({
      check: (limit, identifier) => {
        counted.push(`${limit}:${identifier}`);
        return identifier === refuse
          ? Effect.fail(
              new RateLimits.RateLimited({ limit, retryAfterSeconds: 60 }),
            )
          : Effect.void;
      },
    }),
  );
  return { counted, layer };
};

const fakeDatabase = (options: { blocked?: boolean; user?: boolean } = {}) =>
  Layer.succeed(
    Database.Database,
    Database.Database.of({
      query: (_operation, run) =>
        Effect.promise(() =>
          run({
            user: {
              findUnique: async () =>
                options.user === false ? null : { email: 'Ada@Example.com' },
            },
            blockedEmail: {
              findUnique: async () =>
                options.blocked ? { email: 'ada@example.com' } : null,
            },
          } as never),
        ),
    }),
  );

// Resend unset, so nothing is ever sent.
const layerWith = (
  limits: ReturnType<typeof fakeLimits>,
  database = fakeDatabase(),
) =>
  ManualEmails.layer.pipe(
    Layer.provide(limits.layer),
    Layer.provide(database),
    Layer.provide(Layer.succeed(AppConfig.AppConfig, testConfig)),
  );

const request = {
  email: '  Ada@Lovelace.dev ',
  subject: ' Help ',
  description: 'Something is broken here',
};

const invalid = (overrides: Partial<ManualEmails.SupportRequest>) =>
  typeof ManualEmails.validateSupportRequest({
    ...request,
    ...overrides,
  }) === 'string';

describe('validateSupportRequest', () => {
  it('trims and lowercases', () => {
    assert.deepStrictEqual(ManualEmails.validateSupportRequest(request), {
      email: 'ada@lovelace.dev',
      subject: 'Help',
      description: 'Something is broken here',
    });
  });

  it("refuses Earn's blocked domains, bad addresses and short messages", () => {
    assert.isTrue(invalid({ email: 'ada@example.com' }));
    assert.isTrue(invalid({ email: 'ada@test.com' }));
    assert.isTrue(invalid({ email: 'not-an-address' }));
    assert.isTrue(invalid({ subject: '   ' }));
    assert.isTrue(invalid({ description: 'too short' }));
  });
});

describe('ManualEmails.support', () => {
  it.effect('counts the sender, then the address, against the limit', () =>
    Effect.gen(function* () {
      const limits = fakeLimits();
      const error = yield* ManualEmails.ManualEmails.use((emails) =>
        emails.support(request, '1.2.3.4'),
      ).pipe(Effect.flip, Effect.provide(layerWith(limits)));
      // Without Resend it can't send.
      assert.strictEqual(error._tag, 'SendFailed');
      assert.deepStrictEqual(limits.counted, [
        'supportEmail:ip:1.2.3.4',
        'supportEmail:email:ada@lovelace.dev',
      ]);
    }),
  );

  it.effect('refuses a rate-limited sender before reading the request', () =>
    Effect.gen(function* () {
      const limits = fakeLimits('ip:1.2.3.4');
      const error = yield* ManualEmails.ManualEmails.use((emails) =>
        emails.support({ ...request, email: 'bad' }, '1.2.3.4'),
      ).pipe(Effect.flip, Effect.provide(layerWith(limits)));
      assert.strictEqual(error._tag, 'RateLimited');
    }),
  );

  it.effect('refuses an invalid request before counting the address', () =>
    Effect.gen(function* () {
      const limits = fakeLimits();
      const error = yield* ManualEmails.ManualEmails.use((emails) =>
        emails.support({ ...request, description: 'short' }, '1.2.3.4'),
      ).pipe(Effect.flip, Effect.provide(layerWith(limits)));
      assert.strictEqual(error._tag, 'InvalidSupportRequest');
      assert.deepStrictEqual(limits.counted, ['supportEmail:ip:1.2.3.4']);
    }),
  );
});

describe('ManualEmails.welcomeSponsor', () => {
  it.effect('refuses a blocked address', () =>
    Effect.gen(function* () {
      const error = yield* ManualEmails.ManualEmails.use((emails) =>
        emails.welcomeSponsor('u1'),
      ).pipe(
        Effect.flip,
        Effect.provide(
          layerWith(fakeLimits(), fakeDatabase({ blocked: true })),
        ),
      );
      assert.strictEqual(error._tag, 'BlockedAddress');
    }),
  );

  it.effect('refuses an unknown user', () =>
    Effect.gen(function* () {
      const error = yield* ManualEmails.ManualEmails.use((emails) =>
        emails.welcomeSponsor('u1'),
      ).pipe(
        Effect.flip,
        Effect.provide(layerWith(fakeLimits(), fakeDatabase({ user: false }))),
      );
      assert.strictEqual(error._tag, 'NoUser');
    }),
  );

  it.effect('never fails the sponsor when the email can’t go out', () =>
    ManualEmails.ManualEmails.use((emails) => emails.welcomeSponsor('u1')).pipe(
      Effect.provide(layerWith(fakeLimits())),
    ),
  );
});
