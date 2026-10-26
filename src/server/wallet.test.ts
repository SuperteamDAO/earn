import { assert, describe, it } from '@effect/vitest';
import {
  findAssociatedTokenPda,
  TOKEN_PROGRAM_ADDRESS,
} from '@solana-program/token';
import { TOKEN_2022_PROGRAM_ADDRESS } from '@solana-program/token-2022';
import {
  address,
  generateKeyPair,
  getAddressFromPublicKey,
  getBase58Decoder,
  getBase64Encoder,
  getCompiledTransactionMessageDecoder,
  getTransactionDecoder,
  type Address,
  type Signature,
} from '@solana/kit';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as Layer from 'effect/Layer';
import * as Redacted from 'effect/Redacted';

import * as AppConfig from '@/server/app-config';
import * as Database from '@/server/database';
import { testConfig } from '@/server/test-config';
import * as Wallet from '@/server/wallet';
import * as WalletPrices from '@/server/wallet-prices';
import { SOL_MINT } from '@/server/wallet-prices';
import * as WalletRpc from '@/server/wallet-rpc';

const USDC = address('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
const PYUSD = address('2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo');
const STRANGER = address('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM');
const RECIPIENT = address('7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV');

// A Solana keypair as Earn keeps the fee payer's: base58 of seed and
// public key.
const feePayerKeys = async () => {
  const keys = await crypto.subtle.generateKey('Ed25519', true, [
    'sign',
    'verify',
  ]);
  const pkcs8 = new Uint8Array(
    await crypto.subtle.exportKey('pkcs8', keys.privateKey),
  );
  const raw = new Uint8Array(
    await crypto.subtle.exportKey('raw', keys.publicKey),
  );
  return {
    secret: getBase58Decoder().decode(
      new Uint8Array([...pkcs8.slice(-32), ...raw]),
    ),
    address: await getAddressFromPublicKey(keys.publicKey),
  };
};

const feePayer = await feePayerKeys();
const owner = await getAddressFromPublicKey(
  (await generateKeyPair()).publicKey,
);

const ata = (
  wallet: Address,
  mint: Address,
  program: Address = TOKEN_PROGRAM_ADDRESS,
) =>
  findAssociatedTokenPda({ owner: wallet, mint, tokenProgram: program }).then(
    ([pda]) => pda,
  );

const config = AppConfig.AppConfig.of({
  ...testConfig,
  solana: { ...testConfig.solana, feePayerKey: Redacted.make(feePayer.secret) },
});

const TOKENS = [
  {
    tokenName: 'USD Coin',
    tokenSymbol: 'USDC',
    mintAddress: USDC,
    icon: '/assets/usdc.svg',
    decimals: 6,
  },
  {
    tokenName: 'PayPal USD',
    tokenSymbol: 'PYUSD',
    mintAddress: PYUSD,
    icon: '/assets/pyusd.svg',
    decimals: 6,
  },
];

const fakeDatabase = (walletAddress: string | null) =>
  Layer.succeed(
    Database.Database,
    Database.Database.of({
      query: (_operation, run) =>
        Effect.promise(() =>
          run({
            user: { findUnique: async () => ({ walletAddress }) },
            tokenMetadata: {
              findMany: async () => TOKENS,
              findFirst: async ({
                where,
              }: {
                where: { mintAddress: string };
              }) => TOKENS.find((t) => t.mintAddress === where.mintAddress),
            },
          } as never),
        ),
    }),
  );

const BLOCKHASH = {
  blockhash: 'EkSnNWid2cvwEVnVx9aBqawnmiCNiDgp3gUdkDPTKN1N',
  lastValidBlockHeight: 100n,
} as unknown as WalletRpc.LatestBlockhash;

// The network as the wallet sees it: who owns which accounts, what the
// wallet holds, and what it has done. Records what the fee payer sends.
const fakeRpc = ({
  owners = new Map<string, string>(),
  status = { failed: false, confirmationStatus: 'confirmed' },
  lamports = 0n,
  tokenAccounts = [],
  transactions = [],
}: {
  owners?: ReadonlyMap<string, string>;
  status?: WalletRpc.SignatureStatus;
  lamports?: bigint;
  tokenAccounts?: ReadonlyArray<WalletRpc.TokenAccount>;
  transactions?: ReadonlyArray<WalletRpc.ParsedTransaction | null>;
} = {}) => {
  const sent: Array<string> = [];
  const layer = Layer.succeed(
    WalletRpc.WalletRpc,
    WalletRpc.WalletRpc.of({
      lamports: () => Effect.succeed(lamports),
      tokenAccounts: () => Effect.succeed(tokenAccounts),
      accountOwner: (account) => Effect.succeed(owners.get(account) ?? null),
      latestBlockhash: Effect.succeed(BLOCKHASH),
      send: (wire) =>
        Effect.sync(() => {
          sent.push(wire);
          return 'sig' as Signature;
        }),
      status: () => Effect.succeed(status),
      signatures: () =>
        Effect.succeed(transactions.map((_, index) => `sig-${index}`)),
      transaction: (signature) =>
        Effect.succeed(transactions[Number(signature.slice(4))] ?? null),
    }),
  );
  return { layer, sent };
};

const prices = Layer.succeed(
  WalletPrices.WalletPrices,
  WalletPrices.WalletPrices.of({
    usd: (mint) =>
      mint === SOL_MINT
        ? Effect.succeed(150)
        : mint === USDC
          ? Effect.succeed(1)
          : Effect.succeed(0.5),
  }),
);

const run = <A, E>(
  use: (wallet: Wallet.Wallet['Service']) => Effect.Effect<A, E>,
  {
    rpc = fakeRpc(),
    walletAddress = owner,
    appConfig = config,
  }: {
    rpc?: ReturnType<typeof fakeRpc>;
    walletAddress?: string | null;
    appConfig?: typeof config;
  } = {},
) =>
  Wallet.Wallet.use(use).pipe(
    Effect.provide(
      Wallet.layer.pipe(
        Layer.provide(
          Layer.mergeAll(
            Layer.succeed(AppConfig.AppConfig, appConfig),
            fakeDatabase(walletAddress),
            rpc.layer,
            prices,
          ),
        ),
      ),
    ),
  );

// What a built transaction does: its fee payer, who signed, and which
// programs its instructions call.
const inspect = (wire: string) => {
  const transaction = getTransactionDecoder().decode(
    getBase64Encoder().encode(wire),
  );
  const message = getCompiledTransactionMessageDecoder().decode(
    transaction.messageBytes,
  );
  return {
    feePayer: message.staticAccounts[0],
    signed: Object.entries(transaction.signatures)
      .filter(([, signature]) => signature !== null)
      .map(([signer]) => signer),
    programs: message.instructions.map(
      (instruction) => message.staticAccounts[instruction.programAddressIndex],
    ),
  };
};

const usdc = (amount: string) => ({
  tokenAddress: USDC,
  amount,
  recipientAddress: RECIPIENT,
});

// The fee payer already holds a USDC account, and so (unless said) does the
// recipient.
const accounts = async (recipientHasAccount = true) => {
  const owners = new Map<string, string>([
    [USDC, TOKEN_PROGRAM_ADDRESS],
    [await ata(feePayer.address, USDC), TOKEN_PROGRAM_ADDRESS],
  ]);
  if (recipientHasAccount) {
    owners.set(await ata(RECIPIENT, USDC), TOKEN_PROGRAM_ADDRESS);
  }
  return owners;
};

const refusal = <A, E>(exit: Exit.Exit<A, E>) =>
  Exit.isFailure(exit) ? JSON.stringify(exit.cause) : 'succeeded';

describe('Wallet.withdrawal', () => {
  it.effect(
    'sends a token to an existing account, signed by the fee payer',
    () =>
      Effect.gen(function* () {
        const owners = yield* Effect.promise(() => accounts());
        const result = yield* run(
          (wallet) => wallet.withdrawal('user', usdc('5')),
          { rpc: fakeRpc({ owners }) },
        );
        assert.isTrue(result.receiverATAExists);
        assert.strictEqual(result.ataCreationCost, 0);
        const tx = inspect(result.serializedTransaction);
        assert.strictEqual(tx.feePayer, feePayer.address);
        // Theirs is left for Privy's embedded wallet.
        assert.deepStrictEqual(tx.signed, [feePayer.address]);
        assert.strictEqual(tx.programs.length, 3);
        assert.strictEqual(tx.programs[2], TOKEN_PROGRAM_ADDRESS);
      }),
  );

  it.effect(
    'sets up a missing recipient account and charges its fee in the token',
    () =>
      Effect.gen(function* () {
        const owners = yield* Effect.promise(() => accounts(false));
        const result = yield* run(
          (wallet) => wallet.withdrawal('user', usdc('5')),
          { rpc: fakeRpc({ owners }) },
        );
        assert.isFalse(result.receiverATAExists);
        // 0.0021 SOL at $150, in USDC's base units.
        assert.strictEqual(result.ataCreationCost, 315_000);
        const tx = inspect(result.serializedTransaction);
        // Budget, account setup, the fee to the fee payer, the rest to them.
        assert.strictEqual(tx.programs.length, 5);
      }),
  );

  it.effect('refuses an amount no larger than the setup fee', () =>
    Effect.gen(function* () {
      const owners = yield* Effect.promise(() => accounts(false));
      const exit = yield* run(
        (wallet) => wallet.withdrawal('user', usdc('0.3')),
        { rpc: fakeRpc({ owners }) },
      ).pipe(Effect.exit);
      assert.include(refusal(exit), 'AMOUNT_BELOW_ACCOUNT_SETUP_FEE');
    }),
  );

  it.effect('refuses amounts that round to nothing', () =>
    Effect.gen(function* () {
      const owners = yield* Effect.promise(() => accounts());
      const token = yield* run(
        (wallet) => wallet.withdrawal('user', usdc('0.0000001')),
        { rpc: fakeRpc({ owners }) },
      ).pipe(Effect.exit);
      assert.include(refusal(token), 'AMOUNT_TOO_SMALL');
      const sol = yield* run((wallet) =>
        wallet.withdrawal('user', {
          tokenAddress: SOL_MINT,
          amount: '0.0000000001',
          recipientAddress: RECIPIENT,
        }),
      ).pipe(Effect.exit);
      assert.include(refusal(sol), 'AMOUNT_TOO_SMALL');
    }),
  );

  it.effect('refuses a token Earn does not list', () =>
    Effect.gen(function* () {
      const exit = yield* run((wallet) =>
        wallet.withdrawal('user', { ...usdc('5'), tokenAddress: STRANGER }),
      ).pipe(Effect.exit);
      assert.include(refusal(exit), 'UNSUPPORTED_TOKEN');
    }),
  );

  it.effect('sends SOL with the fee payer paying the fee', () =>
    Effect.gen(function* () {
      const result = yield* run((wallet) =>
        wallet.withdrawal('user', {
          tokenAddress: SOL_MINT,
          amount: '0.5',
          recipientAddress: RECIPIENT,
        }),
      );
      assert.isTrue(result.receiverATAExists);
      const tx = inspect(result.serializedTransaction);
      assert.strictEqual(tx.feePayer, feePayer.address);
      assert.deepStrictEqual(tx.signed, [feePayer.address]);
      assert.strictEqual(tx.programs.length, 1);
    }),
  );

  it.effect('uses Token-2022 for its mints', () =>
    Effect.gen(function* () {
      const owners = new Map<string, string>([
        [PYUSD, TOKEN_2022_PROGRAM_ADDRESS],
        [
          yield* Effect.promise(() =>
            ata(feePayer.address, PYUSD, TOKEN_2022_PROGRAM_ADDRESS),
          ),
          TOKEN_2022_PROGRAM_ADDRESS,
        ],
        [
          yield* Effect.promise(() =>
            ata(RECIPIENT, PYUSD, TOKEN_2022_PROGRAM_ADDRESS),
          ),
          TOKEN_2022_PROGRAM_ADDRESS,
        ],
      ]);
      const result = yield* run(
        (wallet) =>
          wallet.withdrawal('user', { ...usdc('5'), tokenAddress: PYUSD }),
        { rpc: fakeRpc({ owners }) },
      );
      const tx = inspect(result.serializedTransaction);
      assert.strictEqual(tx.programs[2], TOKEN_2022_PROGRAM_ADDRESS);
    }),
  );

  it.effect(
    'opens the fee payer’s own token account first if it has none',
    () =>
      Effect.gen(function* () {
        const owners = new Map<string, string>([[USDC, TOKEN_PROGRAM_ADDRESS]]);
        const rpc = fakeRpc({ owners });
        yield* run((wallet) => wallet.withdrawal('user', usdc('5')), { rpc });
        assert.strictEqual(rpc.sent.length, 1);
        const setup = inspect(rpc.sent[0] ?? '');
        assert.deepStrictEqual(setup.signed, [feePayer.address]);

        const failing = fakeRpc({
          owners,
          status: { failed: true, confirmationStatus: null },
        });
        const exit = yield* run(
          (wallet) => wallet.withdrawal('user', usdc('5')),
          { rpc: failing },
        ).pipe(Effect.exit);
        assert.include(refusal(exit), 'fee-payer-account');
      }),
  );

  it.effect('refuses without a fee payer or a wallet', () =>
    Effect.gen(function* () {
      const noFeePayer = yield* run(
        (wallet) =>
          wallet.withdrawal('user', {
            tokenAddress: SOL_MINT,
            amount: '1',
            recipientAddress: RECIPIENT,
          }),
        { appConfig: testConfig },
      ).pipe(Effect.exit);
      assert.include(refusal(noFeePayer), 'WithdrawalUnavailable');
      const noWallet = yield* run(
        (wallet) =>
          wallet.withdrawal('user', {
            tokenAddress: SOL_MINT,
            amount: '1',
            recipientAddress: RECIPIENT,
          }),
        { walletAddress: null },
      ).pipe(Effect.exit);
      assert.include(refusal(noWallet), 'NoWallet');
    }),
  );
});

describe('Wallet.assets', () => {
  it.effect('lists SOL and every token held, pricing those Earn lists', () =>
    Effect.gen(function* () {
      const assets = yield* run((wallet) => wallet.assets('user'), {
        rpc: fakeRpc({
          lamports: 2_000_000_000n,
          tokenAccounts: [
            { mint: USDC, amount: 12_500_000n, decimals: 6 },
            { mint: STRANGER, amount: 7n, decimals: 0 },
            { mint: PYUSD, amount: 0n, decimals: 6 },
          ],
        }),
      });
      assert.deepStrictEqual(
        assets.map((asset) => [
          asset.tokenSymbol,
          asset.amount,
          asset.usdValue,
        ]),
        [
          ['SOL', 2, 300],
          ['USDC', 12.5, 12.5],
          ['Unknown', 7, 0],
        ],
      );
    }),
  );
});

describe('Wallet.activity', () => {
  it.effect('reads SOL and listed tokens moving through the wallet', () =>
    Effect.gen(function* () {
      const base = {
        blockTime: 1_700_000_000,
        preTokenBalances: [],
        postTokenBalances: [],
      };
      const activity = yield* run((wallet) => wallet.activity('user'), {
        rpc: fakeRpc({
          transactions: [
            // 1 SOL in.
            {
              ...base,
              accountKeys: [RECIPIENT, owner],
              preBalances: [5_000_000_000n, 0n],
              postBalances: [4_000_000_000n, 1_000_000_000n],
              instructions: [
                {
                  program: 'system',
                  type: 'transfer',
                  source: RECIPIENT,
                  destination: owner,
                },
              ],
            },
            // Dust, left out.
            {
              ...base,
              blockTime: 1_700_000_100,
              accountKeys: [owner],
              preBalances: [0n],
              postBalances: [100n],
              instructions: [],
            },
            // 3 USDC out.
            {
              blockTime: 1_700_000_200,
              accountKeys: [owner],
              preBalances: [0n],
              postBalances: [0n],
              preTokenBalances: [
                {
                  accountIndex: 1,
                  mint: USDC,
                  owner,
                  uiAmountString: '10',
                },
              ],
              postTokenBalances: [
                { accountIndex: 1, mint: USDC, owner, uiAmountString: '7' },
              ],
              instructions: [
                {
                  program: 'spl-token',
                  type: 'transferChecked',
                  source: 'source-account',
                  destination: 'destination-account',
                },
              ],
            },
          ],
        }),
      });
      assert.deepStrictEqual(
        activity.map((row) => [
          row.type,
          row.tokenSymbol,
          row.amount,
          row.usdValue,
          row.counterpartyAddress,
        ]),
        [
          ['Withdrawn', 'USDC', 3, 3, 'destination-account'],
          ['Credited', 'SOL', 1, 150, RECIPIENT],
        ],
      );
    }),
  );
});
