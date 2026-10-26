import { assert, describe, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as Redacted from 'effect/Redacted';
import { afterEach, vi } from 'vitest';

import * as AppConfig from '@/server/app-config';
import * as Database from '@/server/database';
import * as Kyc from '@/server/kyc';
import * as ListingKyc from '@/server/listing-kyc';
import { paymentFields } from '@/server/listing-payments';
import * as Locks from '@/server/locks';
import { testConfig } from '@/server/test-config';

const ANNOUNCED = new Date('2025-09-01T00:00:00Z');

const winning = (overrides: Record<string, unknown> = {}) => ({
  id: 's1',
  isWinner: true,
  isPaid: false,
  listing: {
    title: 'Write a thread',
    region: 'Global',
    isWinnersAnnounced: true,
    isFndnPaying: true,
    winnersAnnouncedAt: ANNOUNCED,
  },
  user: { isKYCVerified: false },
  ...overrides,
});

const payableRow = {
  id: 's1',
  winnerPosition: 1,
  listing: {
    title: 'Write a thread',
    rewards: { '1': 500, '2': 250 },
    type: 'bounty',
    slug: 'write-a-thread',
  },
  user: {
    isKYCVerified: true,
    email: 'ada@example.com',
    username: 'ada',
    location: 'India',
    walletAddress: 'Wallet111',
    kycName: 'Ada Lovelace',
    kycAddress: null,
    kycDOB: '1990-01-01',
    kycIDNumber: 'P123',
    kycIDType: 'PASSPORT',
    kycCountry: 'IND',
  },
};

interface Options {
  submission?: unknown;
  verification?: Kyc.Verification;
  lockBusy?: boolean;
}

const setup = (options: Options = {}) => {
  const writes: Array<{ call: string; args: unknown }> = [];
  const client = {
    submission: {
      findFirst: async () =>
        'submission' in options ? options.submission : winning(),
      findMany: async () => [payableRow],
      update: async (args: unknown) => {
        writes.push({ call: 'submission.update', args });
        return { id: 's1' };
      },
    },
    user: {
      update: async (args: unknown) => {
        writes.push({ call: 'user.update', args });
        return { id: 'u1' };
      },
    },
    chapter: {
      findMany: async () => [
        {
          id: 'c1',
          name: 'Superteam India',
          region: 'India',
          displayValue: 'India',
          slug: 'india',
          code: 'IN',
          countries: ['India'],
          banner: null,
          icons: null,
          link: null,
          hello: null,
          nationality: null,
        },
      ],
    },
  };
  const database = Layer.succeed(
    Database.Database,
    Database.Database.of({
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      query: (_operation, run) => Effect.promise(() => run(client as never)),
    }),
  );
  const kyc = Layer.succeed(
    Kyc.Kyc,
    Kyc.Kyc.of({
      accessToken: (userId) => Effect.succeed(`token-for-${userId}`),
      applicant: () =>
        Effect.succeed({
          id: 'app1',
          fullName: 'Ada Lovelace',
          country: 'IND',
          dob: '1990-01-01',
          idNumber: 'P123',
          idType: 'PASSPORT',
        }),
      verification: () => Effect.succeed(options.verification ?? 'verified'),
    }),
  );
  const locked: Array<string> = [];
  const locks = Layer.succeed(
    Locks.Locks,
    Locks.Locks.of({
      with: (key, effect) => {
        locked.push(key);
        return options.lockBusy
          ? Effect.fail(new Locks.LockBusy({ key }))
          : effect;
      },
    }),
  );
  const config = Layer.succeed(AppConfig.AppConfig, {
    ...testConfig,
    airtable: {
      token: Redacted.make('airtable-token'),
      base: undefined,
      grantsBase: undefined,
      grantsTable: undefined,
      grantsRegionsTable: undefined,
      recipientsTable: undefined,
      paymentsBase: 'appPayments',
      paymentsTable: 'Payments',
      paymentsRegionsTable: 'Regions',
      gdpBase: undefined,
      gdpSponsorsTable: undefined,
    },
  });
  const layer = ListingKyc.layer.pipe(
    Layer.provide(Layer.mergeAll(database, kyc, locks, config)),
  );
  return { layer, writes, locked };
};

// Airtable, faked: no payment yet, the India region, then the insert.
const airtableCalls: Array<{ url: string; body: unknown }> = [];
const fakeAirtable = () => {
  airtableCalls.length = 0;
  vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
    const body: unknown =
      typeof init?.body === 'string' ? JSON.parse(init.body) : null;
    airtableCalls.push({ url, body });
    if (init?.method === 'POST') {
      return Response.json({ records: [{ id: 'recNew' }] });
    }
    return Response.json({
      records: url.includes('/Regions') ? [{ id: 'recIndia' }] : [],
    });
  });
};

afterEach(() => {
  vi.unstubAllGlobals();
});

const run = <A, E>(
  layer: Layer.Layer<ListingKyc.ListingKyc>,
  use: (kyc: ListingKyc.ListingKyc['Service']) => Effect.Effect<A, E>,
) => ListingKyc.ListingKyc.use(use).pipe(Effect.provide(layer));

describe('ListingKyc.verify', () => {
  it.effect('records the KYC and sends the winnings for payment', () =>
    Effect.gen(function* () {
      fakeAirtable();
      const { layer, writes, locked } = setup();
      const result = yield* run(layer, (kyc) => kyc.verify('u1', 'thread'));
      assert.strictEqual(result, 'verified');
      assert.deepStrictEqual(locked, ['locks:create-payment:u1']);
      const userUpdate = writes.find((write) => write.call === 'user.update');
      assert.deepInclude(
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion
        (userUpdate?.args as { data: Record<string, unknown> } | undefined)
          ?.data,
        {
          isKYCVerified: true,
          kycName: 'Ada Lovelace',
          kycCountry: 'IND',
          kycIDType: 'PASSPORT',
        },
      );
      const insert = airtableCalls.find((call) => call.body !== null);
      assert.include(insert?.url, '/appPayments/Payments');
      assert.deepStrictEqual(insert?.body, {
        records: [
          {
            fields: {
              ...paymentFields(
                {
                  id: 's1',
                  winnerPosition: 1,
                  listing: {
                    title: 'Write a thread',
                    rewards: { '1': 500, '2': 250 },
                    type: 'bounty',
                    slug: 'write-a-thread',
                  },
                  user: {
                    email: 'ada@example.com',
                    username: 'ada',
                    walletAddress: 'Wallet111',
                    kycName: 'Ada Lovelace',
                    kycAddress: null,
                    kycDOB: '1990-01-01',
                    kycIDNumber: 'P123',
                    kycIDType: 'PASSPORT',
                    kycCountry: 'IND',
                  },
                },
                'recIndia',
                false,
              ),
            },
          },
        ],
        typecast: true,
      });
      assert.isTrue(
        writes.some(
          (write) =>
            write.call === 'submission.update' &&
            JSON.stringify(write.args).includes('"paymentSynced":true'),
        ),
      );
    }),
  );

  it.effect('pays only the first time they are verified', () =>
    Effect.gen(function* () {
      fakeAirtable();
      const { layer, writes } = setup({
        submission: winning({ user: { isKYCVerified: true } }),
      });
      assert.strictEqual(
        yield* run(layer, (kyc) => kyc.verify('u1', 'thread')),
        'verified',
      );
      assert.isTrue(writes.some((write) => write.call === 'user.update'));
      assert.lengthOf(airtableCalls, 0);
    }),
  );

  it.effect('refuses submissions that are not paid through KYC', () =>
    Effect.gen(function* () {
      const cases = [
        winning({ isWinner: false }),
        winning({ isPaid: true }),
        winning({
          listing: { ...winning().listing, isFndnPaying: false },
        }),
        winning({
          listing: {
            ...winning().listing,
            winnersAnnouncedAt: new Date('2025-07-01T00:00:00Z'),
          },
        }),
      ];
      for (const submission of cases) {
        const { layer, writes } = setup({ submission });
        assert.deepStrictEqual(
          yield* run(layer, (kyc) => kyc.verify('u1', 'thread')),
          { notAllowed: true },
        );
        assert.lengthOf(writes, 0);
      }
    }),
  );

  it.effect('records nothing until Sumsub says verified', () =>
    Effect.gen(function* () {
      const { layer, writes } = setup({
        verification: { status: 'failed', reason: 'Blurry photo' },
      });
      assert.deepStrictEqual(
        yield* run(layer, (kyc) => kyc.verify('u1', 'thread')),
        { status: 'failed', reason: 'Blurry photo' },
      );
      assert.lengthOf(writes, 0);
    }),
  );

  it.effect('fails while another payment run holds the lock', () =>
    Effect.gen(function* () {
      const { layer, writes } = setup({ lockBusy: true });
      const error = yield* Effect.flip(
        run(layer, (kyc) => kyc.verify('u1', 'thread')),
      );
      assert.strictEqual(error._tag, 'LockBusy');
      assert.lengthOf(writes, 0);
    }),
  );

  it.effect('fails without a submission of theirs', () =>
    Effect.gen(function* () {
      const { layer } = setup({ submission: null });
      const error = yield* Effect.flip(
        run(layer, (kyc) => kyc.verify('u1', 'thread')),
      );
      assert.strictEqual(error._tag, 'KycSubmissionNotFound');
    }),
  );
});

describe('ListingKyc.pending', () => {
  it.effect('only while their winning submission waits for KYC', () =>
    Effect.gen(function* () {
      const waiting = setup();
      const pending = yield* run(waiting.layer, (kyc) =>
        kyc.pending('u1', 'thread'),
      );
      assert.deepStrictEqual(
        pending,
        Option.some({
          submissionId: 's1',
          listingTitle: 'Write a thread',
          region: 'Global',
        }),
      );
      const done = setup({
        submission: winning({ user: { isKYCVerified: true } }),
      });
      assert.isTrue(
        Option.isNone(
          yield* run(done.layer, (kyc) => kyc.pending('u1', 'thread')),
        ),
      );
    }),
  );
});

describe('paymentFields', () => {
  it('names the rank, listing and region as the payments team reads them', () => {
    const fields = paymentFields(
      {
        id: 's9',
        winnerPosition: 2,
        listing: {
          title: 'Design a logo',
          rewards: { '1': 1000, '2': 400 },
          type: 'hackathon',
          slug: 'logo',
        },
        user: {
          email: 'b@example.com',
          username: 'bee',
          walletAddress: 'W',
          kycName: 'Bee',
          kycAddress: 'Street 1',
          kycDOB: '2000-02-02',
          kycIDNumber: 'X1',
          kycIDType: 'ID_CARD',
          kycCountry: 'ARE',
        },
      },
      'recUAE',
      true,
    );
    assert.strictEqual(fields.Amount, 400);
    assert.deepStrictEqual(fields.Category, ['rec03uWVyyixPpSVM']);
    assert.strictEqual(
      fields['Purpose of Payment'],
      'SECOND in Design a logo (https://superteam.fun/earn/listing/logo) — b@example.com',
    );
    assert.strictEqual(fields['Country of Residence'], 'United Arab Emirates');
    assert.deepStrictEqual(fields.Region, ['recUAE']);
    assert.strictEqual(fields.earnApplicationId, 's9');
  });
});
