import 'server-only';

import {
  getSetComputeUnitLimitInstruction,
  getSetComputeUnitPriceInstruction,
} from '@solana-program/compute-budget';
import { getTransferSolInstruction } from '@solana-program/system';
import {
  findAssociatedTokenPda,
  getCreateAssociatedTokenInstruction,
  getTransferInstruction,
  TOKEN_PROGRAM_ADDRESS,
} from '@solana-program/token';
import {
  getTransferCheckedInstruction as getTransferCheckedInstruction2022,
  TOKEN_2022_PROGRAM_ADDRESS,
} from '@solana-program/token-2022';
import {
  address,
  appendTransactionMessageInstructions,
  createKeyPairFromBytes,
  createNoopSigner,
  createSignerFromKeyPair,
  createTransactionMessage,
  getBase58Encoder,
  getBase64EncodedWireTransaction,
  isAddress,
  partiallySignTransactionMessageWithSigners,
  pipe,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
  type Address,
  type Instruction,
  type KeyPairSigner,
  type TransactionSigner,
} from '@solana/kit';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Redacted from 'effect/Redacted';
import * as Schema from 'effect/Schema';

import * as AppConfig from '@/server/app-config';
import * as Database from '@/server/database';
import * as WalletPrices from '@/server/wallet-prices';
import { SOL_MINT } from '@/server/wallet-prices';
import * as WalletRpc from '@/server/wallet-rpc';

import type { TokenActivity } from '@/features/wallet/types/TokenActivity';
import type { TokenAsset } from '@/features/wallet/types/TokenAsset';
import { normalizeTokenIcon } from '@/features/wallet/utils/token-icon';
import type { WithdrawFormData } from '@/features/wallet/utils/withdrawal';

const LAMPORTS_PER_SOL = 1_000_000_000;
const SOL_ICON = '/cdn/coinmarketcap/static/img/coins/64x64/16116.png';

// What the fee payer charges, in SOL at today's price, for setting up a
// recipient's token account.
const ATA_COST_SOL = 0.0021;

// The account has no embedded wallet (or no account at all).
export class NoWallet extends Schema.TaggedError<NoWallet>()('NoWallet', {}) {
  override get message() {
    return 'No wallet for this account';
  }
}

// A withdrawal Earn refuses as asked; the codes are the client's contract.
export class WithdrawalRefused extends Schema.TaggedError<WithdrawalRefused>()(
  'WithdrawalRefused',
  {
    code: Schema.Literals([
      'AMOUNT_BELOW_ACCOUNT_SETUP_FEE',
      'AMOUNT_TOO_SMALL',
      'UNSUPPORTED_TOKEN',
    ]),
  },
) {
  override get message() {
    return `Withdrawal refused: ${this.code}`;
  }
}

// Earn can't build withdrawals right now: no fee payer, or it couldn't set
// up its own token account.
export class WithdrawalUnavailable extends Schema.TaggedError<WithdrawalUnavailable>()(
  'WithdrawalUnavailable',
  { reason: Schema.Literals(['fee-payer', 'fee-payer-account']) },
) {
  override get message() {
    return `Withdrawal unavailable: ${this.reason}`;
  }
}

type ReadFailure =
  | NoWallet
  | Database.DatabaseError
  | WalletRpc.RpcFailure
  | WalletPrices.PriceUnavailable
  | WalletPrices.PriceNotFound;

export interface Withdrawal {
  // Base64 wire transaction, signed by the fee payer; theirs to sign and send.
  readonly serializedTransaction: string;
  readonly receiverATAExists: boolean;
  // In the token's base units, taken from the amount; 0 when none.
  readonly ataCreationCost: number;
}

// Earn's wallet: what the embedded wallet holds, what moved through it, and
// withdrawals built for it with Earn's fee payer paying the network fees.
export class Wallet extends Context.Service<
  Wallet,
  {
    readonly assets: (
      userId: string,
    ) => Effect.Effect<ReadonlyArray<TokenAsset>, ReadFailure>;
    readonly activity: (
      userId: string,
    ) => Effect.Effect<
      ReadonlyArray<TokenActivity>,
      NoWallet | Database.DatabaseError | WalletRpc.RpcFailure
    >;
    // The transfer, partially signed by the fee payer, as Earn's
    // create-signed-transaction built it.
    readonly withdrawal: (
      userId: string,
      input: WithdrawFormData,
    ) => Effect.Effect<
      Withdrawal,
      WithdrawalRefused | WithdrawalUnavailable | ReadFailure
    >;
  }
>()('earn/Wallet') {}

// How many signatures the activity reads, and how it pages through them:
// a few at a time, pausing between, to stay gentle on the RPC.
const ACTIVITY_LIMIT = 50;
const ACTIVITY_BATCH = 5;
const ACTIVITY_PAUSE = '300 millis';

const transferInstruction = (
  source: Address,
  destination: Address,
  authority: TransactionSigner,
  amount: bigint,
  mint: Address,
  decimals: number,
  isToken2022: boolean,
): Instruction =>
  isToken2022
    ? getTransferCheckedInstruction2022({
        source,
        mint,
        destination,
        authority,
        amount,
        decimals,
      })
    : getTransferInstruction({ source, destination, authority, amount });

const make = Effect.gen(function* () {
  const config = yield* AppConfig.AppConfig;
  const database = yield* Database.Database;
  const rpc = yield* WalletRpc.WalletRpc;
  const prices = yield* WalletPrices.WalletPrices;

  // The fee payer's signer, made on first use. A bad key fails that
  // withdrawal, not the server.
  let feePayer: Promise<KeyPairSigner> | null = null;
  const feePayerSigner = Effect.suspend(() => {
    const key = config.solana.feePayerKey;
    if (!key) {
      return Effect.logError('Fee payer private key not configured').pipe(
        Effect.andThen(
          Effect.fail(new WithdrawalUnavailable({ reason: 'fee-payer' })),
        ),
      );
    }
    feePayer ??= Promise.resolve()
      .then(() =>
        createKeyPairFromBytes(
          new Uint8Array(getBase58Encoder().encode(Redacted.value(key))),
        ),
      )
      .then(createSignerFromKeyPair);
    const pending = feePayer;
    return Effect.tryPromise({
      try: () => pending,
      catch: () => {
        feePayer = null;
        return new WithdrawalUnavailable({ reason: 'fee-payer' });
      },
    });
  });

  const walletOf = Effect.fn('Wallet.walletOf')(function* (userId: string) {
    const user = yield* database.query('walletAddress', (client) =>
      client.user.findUnique({
        where: { id: userId },
        select: { walletAddress: true },
      }),
    );
    const wallet = user?.walletAddress;
    if (!wallet || !isAddress(wallet)) return yield* new NoWallet();
    return address(wallet);
  });

  const tokenList = database.query('walletTokenList', (client) =>
    client.tokenMetadata.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { tokenSymbol: 'asc' }],
      select: {
        tokenName: true,
        tokenSymbol: true,
        mintAddress: true,
        icon: true,
        decimals: true,
      },
    }),
  );

  const assets = Effect.fn('Wallet.assets')(function* (userId: string) {
    const owner = yield* walletOf(userId);
    const [tokens, lamports, accounts] = yield* Effect.all(
      [tokenList, rpc.lamports(owner), rpc.tokenAccounts(owner)],
      { concurrency: 'unbounded' },
    );

    const held: Array<TokenAsset> = [];
    if (lamports > 0n) {
      const solPrice = yield* prices.usd(SOL_MINT);
      const amount = Number(lamports) / LAMPORTS_PER_SOL;
      held.push({
        tokenAddress: SOL_MINT,
        tokenSymbol: 'SOL',
        tokenImg: SOL_ICON,
        amount,
        usdValue: amount * solPrice,
        tokenName: 'Solana',
        decimals: 9,
      });
    }

    // Every token account, priced when Earn lists its token; a stranger's
    // token shows as Unknown, unpriced.
    const tokenAssets = yield* Effect.forEach(
      accounts,
      (account) =>
        Effect.gen(function* () {
          const amount = Number(account.amount) / 10 ** account.decimals;
          const token = tokens.find((t) => t.mintAddress === account.mint);
          if (!token) {
            return {
              tokenAddress: account.mint,
              tokenSymbol: 'Unknown',
              tokenImg: '',
              amount,
              usdValue: 0,
              tokenName: 'Unknown',
              decimals: account.decimals,
            } satisfies TokenAsset;
          }
          const price = yield* prices.usd(token.mintAddress);
          return {
            tokenAddress: account.mint,
            tokenSymbol: token.tokenSymbol,
            tokenImg: normalizeTokenIcon(token.icon),
            amount,
            usdValue: amount * price,
            tokenName: token.tokenName,
            decimals: account.decimals,
          } satisfies TokenAsset;
        }),
      { concurrency: 5 },
    );

    return [...held, ...tokenAssets.filter((asset) => asset.amount > 0)];
  });

  // A price for activity rows; unknown is 0, as Earn shows it.
  const priceOrZero = (mint: string) =>
    prices.usd(mint).pipe(Effect.orElseSucceed(() => 0));

  const activity = Effect.fn('Wallet.activity')(function* (userId: string) {
    const owner = yield* walletOf(userId);
    const [tokens, signatures] = yield* Effect.all(
      [tokenList, rpc.signatures(owner, ACTIVITY_LIMIT)],
      { concurrency: 'unbounded' },
    );

    const activities: Array<TokenActivity> = [];
    for (let start = 0; start < signatures.length; start += ACTIVITY_BATCH) {
      if (start > 0) yield* Effect.sleep(ACTIVITY_PAUSE);
      const batch = signatures.slice(start, start + ACTIVITY_BATCH);
      const transactions = yield* Effect.forEach(batch, rpc.transaction, {
        concurrency: ACTIVITY_BATCH,
      });
      const solPrice = yield* priceOrZero(SOL_MINT);

      for (const [index, tx] of transactions.entries()) {
        if (!tx) continue;
        const signature = batch[index] ?? '';
        const timestamp =
          tx.blockTime === null ? Date.now() : tx.blockTime * 1000;

        // SOL moving in or out of the wallet itself.
        const walletIndex = tx.accountKeys.indexOf(owner);
        if (walletIndex !== -1) {
          const change =
            Number(
              (tx.postBalances[walletIndex] ?? 0n) -
                (tx.preBalances[walletIndex] ?? 0n),
            ) / LAMPORTS_PER_SOL;
          const amount = Math.abs(change);
          // Earn leaves out this one dust amount.
          if (change !== 0 && amount !== 1e-7) {
            const transfer = tx.instructions.find(
              (instruction) =>
                instruction.type === 'transfer' &&
                (instruction.source === owner ||
                  instruction.destination === owner),
            );
            const counterpartyAddress =
              transfer?.source && transfer.destination
                ? transfer.source === owner
                  ? transfer.destination
                  : transfer.source
                : '';
            activities.push({
              type: change > 0 ? 'Credited' : 'Withdrawn',
              amount,
              usdValue: amount * solPrice,
              tokenAddress: SOL_MINT,
              counterpartyAddress,
              tokenSymbol: 'SOL',
              tokenImg: SOL_ICON,
              timestamp,
              signature,
            });
          }
        }

        // Tokens Earn lists, in the wallet's own token accounts.
        if (!tx.postTokenBalances || !tx.preTokenBalances) continue;
        const pre = tx.preTokenBalances;
        for (const post of tx.postTokenBalances) {
          if (post.owner !== owner) continue;
          const before = pre.find(
            (balance) => balance.accountIndex === post.accountIndex,
          );
          const change =
            parseFloat(post.uiAmountString ?? '0') -
            parseFloat(before?.uiAmountString ?? '0');
          if (change === 0) continue;
          const token = tokens.find((t) => t.mintAddress === post.mint);
          if (!token) continue;
          const amount = Math.abs(change);
          const price = yield* priceOrZero(post.mint);
          const transfer = tx.instructions.find(
            (instruction) =>
              (instruction.type === 'transfer' ||
                instruction.type === 'transferChecked') &&
              instruction.program === 'spl-token',
          );
          const counterpartyAddress =
            transfer?.source && transfer.destination
              ? change > 0
                ? transfer.source
                : transfer.destination
              : '';
          activities.push({
            type: change > 0 ? 'Credited' : 'Withdrawn',
            amount,
            usdValue: amount * price,
            tokenAddress: post.mint,
            counterpartyAddress,
            tokenSymbol: token.tokenSymbol,
            tokenImg: normalizeTokenIcon(token.icon),
            timestamp,
            signature,
          });
        }
      }
    }

    return activities.toSorted((a, b) => b.timestamp - a.timestamp);
  });

  // Which token program owns a mint, remembered per process. Unreadable
  // counts as the classic one, as Earn does.
  const programs = new Map<string, string>();
  const isToken2022 = (mint: Address) =>
    Effect.gen(function* () {
      const known = programs.get(mint);
      if (known) return known === TOKEN_2022_PROGRAM_ADDRESS;
      const owner = yield* rpc.accountOwner(mint).pipe(
        Effect.tapError(() =>
          Effect.logError('Error checking token program').pipe(
            Effect.annotateLogs({ mint }),
          ),
        ),
        Effect.orElseSucceed(() => null),
      );
      if (!owner) return false;
      programs.set(mint, owner);
      return owner === TOKEN_2022_PROGRAM_ADDRESS;
    });

  // The fee payer opens its own account for a token the first time someone
  // withdraws it, so setup fees have somewhere to go. True once confirmed.
  const createFeePayerAccount = (
    signer: KeyPairSigner,
    mint: Address,
    account: Address,
    tokenProgram: Address,
  ) =>
    Effect.gen(function* () {
      const latestBlockhash = yield* rpc.latestBlockhash;
      const message = pipe(
        createTransactionMessage({ version: 0 }),
        (tx) => setTransactionMessageFeePayerSigner(signer, tx),
        (tx) =>
          setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
        (tx) =>
          appendTransactionMessageInstructions(
            [
              getSetComputeUnitLimitInstruction({ units: 200000 }),
              getSetComputeUnitPriceInstruction({ microLamports: 100000n }),
              getCreateAssociatedTokenInstruction({
                payer: signer,
                ata: account,
                owner: signer.address,
                mint,
                tokenProgram,
              }),
            ],
            tx,
          ),
      );
      const signed = yield* Effect.promise(() =>
        signTransactionMessageWithSigners(message),
      );
      const signature = yield* rpc.send(
        getBase64EncodedWireTransaction(signed),
      );
      for (let attempt = 0; attempt < 30; attempt++) {
        const status = yield* rpc.status(signature);
        if (status?.failed) return false;
        if (
          status?.confirmationStatus === 'confirmed' ||
          status?.confirmationStatus === 'finalized'
        ) {
          yield* Effect.logInfo('Created fee payer ATA').pipe(
            Effect.annotateLogs({ account }),
          );
          return true;
        }
        yield* Effect.sleep('500 millis');
      }
      yield* Effect.logError('Fee payer ATA confirmation timeout');
      return false;
    }).pipe(
      Effect.catch((error) =>
        Effect.logError('Error creating fee payer ATA').pipe(
          Effect.annotateLogs({ error: error.message }),
          Effect.as(false),
        ),
      ),
    );

  // The recipient's token account setup fee, in the token's base units.
  const ataCreationCost = (mint: string, decimals: number) =>
    Effect.gen(function* () {
      const tokenUsd = yield* prices.usd(mint);
      const solUsd = yield* prices.usd(SOL_MINT);
      return Math.ceil(((solUsd * ATA_COST_SOL) / tokenUsd) * 10 ** decimals);
    });

  const withdrawal = Effect.fn('Wallet.withdrawal')(function* (
    userId: string,
    input: WithdrawFormData,
  ) {
    const signer = yield* feePayerSigner;
    const recipient = address(input.recipientAddress);

    if (input.tokenAddress === SOL_MINT) {
      const sender = createNoopSigner(yield* walletOf(userId));
      const latestBlockhash = yield* rpc.latestBlockhash;
      const lamports = BigInt(
        Math.floor(Number(input.amount) * LAMPORTS_PER_SOL),
      );
      if (lamports <= 0n) {
        return yield* new WithdrawalRefused({ code: 'AMOUNT_TOO_SMALL' });
      }
      const message = pipe(
        createTransactionMessage({ version: 0 }),
        (tx) => setTransactionMessageFeePayerSigner(signer, tx),
        (tx) =>
          setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
        (tx) =>
          appendTransactionMessageInstructions(
            [
              getTransferSolInstruction({
                source: sender,
                destination: recipient,
                amount: lamports,
              }),
            ],
            tx,
          ),
      );
      const signed = yield* Effect.promise(() =>
        partiallySignTransactionMessageWithSigners(message),
      );
      return {
        serializedTransaction: getBase64EncodedWireTransaction(signed),
        receiverATAExists: true,
        ataCreationCost: 0,
      } satisfies Withdrawal;
    }

    if (!isAddress(input.tokenAddress)) {
      return yield* new WithdrawalRefused({ code: 'UNSUPPORTED_TOKEN' });
    }
    const mint = address(input.tokenAddress);
    const token2022 = yield* isToken2022(mint);
    const tokenProgram = token2022
      ? TOKEN_2022_PROGRAM_ADDRESS
      : TOKEN_PROGRAM_ADDRESS;

    const token = yield* database.query('withdrawalToken', (client) =>
      client.tokenMetadata.findFirst({
        where: { mintAddress: mint, isActive: true },
        select: { tokenSymbol: true, decimals: true },
      }),
    );
    if (!token) {
      return yield* new WithdrawalRefused({ code: 'UNSUPPORTED_TOKEN' });
    }

    const ata = (owner: Address) =>
      Effect.promise(() =>
        findAssociatedTokenPda({ mint, owner, tokenProgram }).then(
          ([pda]) => pda,
        ),
      );

    const feePayerAccount = yield* ata(signer.address);
    if ((yield* rpc.accountOwner(feePayerAccount)) === null) {
      const created = yield* createFeePayerAccount(
        signer,
        mint,
        feePayerAccount,
        tokenProgram,
      );
      if (!created) {
        return yield* new WithdrawalUnavailable({
          reason: 'fee-payer-account',
        });
      }
    }

    const owner = yield* walletOf(userId);
    const latestBlockhash = yield* rpc.latestBlockhash;
    const sender = createNoopSigner(owner);
    const decimals = token.decimals;
    const senderAccount = yield* ata(owner);
    const receiverAccount = yield* ata(recipient);
    const receiverMissing = (yield* rpc.accountOwner(receiverAccount)) === null;

    const instructions: Array<Instruction> = [
      getSetComputeUnitLimitInstruction({ units: 200000 }),
      getSetComputeUnitPriceInstruction({ microLamports: 500000n }),
    ];
    const transfer = (destination: Address, amount: number) =>
      transferInstruction(
        senderAccount,
        destination,
        sender,
        BigInt(amount),
        mint,
        decimals,
        token2022,
      );

    let cost = 0;
    const amount = Math.floor(Number(input.amount) * 10 ** decimals);
    if (!Number.isFinite(amount) || amount <= 0) {
      return yield* new WithdrawalRefused({ code: 'AMOUNT_TOO_SMALL' });
    }

    if (receiverMissing) {
      cost = yield* ataCreationCost(mint, decimals);
      yield* Effect.logInfo('ATA creation cost').pipe(
        Effect.annotateLogs({ cost, token: token.tokenSymbol }),
      );
      instructions.push(
        getCreateAssociatedTokenInstruction({
          payer: signer,
          ata: receiverAccount,
          owner: recipient,
          mint,
          tokenProgram,
        }),
      );
      if (cost > 0) {
        if (amount <= cost) {
          return yield* new WithdrawalRefused({
            code: 'AMOUNT_BELOW_ACCOUNT_SETUP_FEE',
          });
        }
        instructions.push(
          transfer(feePayerAccount, cost),
          transfer(receiverAccount, amount - cost),
        );
      } else {
        instructions.push(transfer(receiverAccount, amount));
      }
    } else {
      instructions.push(transfer(receiverAccount, amount));
    }

    const message = pipe(
      createTransactionMessage({ version: 0 }),
      (tx) => setTransactionMessageFeePayerSigner(signer, tx),
      (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
      (tx) => appendTransactionMessageInstructions(instructions, tx),
    );
    const signed = yield* Effect.promise(() =>
      partiallySignTransactionMessageWithSigners(message),
    );
    return {
      serializedTransaction: getBase64EncodedWireTransaction(signed),
      receiverATAExists: !receiverMissing,
      ataCreationCost: receiverMissing ? cost : 0,
    } satisfies Withdrawal;
  });

  return Wallet.of({ assets, activity, withdrawal });
});

export const layer = Layer.effect(Wallet, make);
