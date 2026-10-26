import 'server-only';

import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Redacted from 'effect/Redacted';
import * as Schedule from 'effect/Schedule';
import * as Schema from 'effect/Schema';

import * as AppConfig from '@/server/app-config';
import * as Database from '@/server/database';

export interface PaymentToken {
  readonly tokenSymbol: string;
  readonly mintAddress: string;
  readonly decimals: number;
}

export class ChainError extends Schema.TaggedError<ChainError>()('ChainError', {
  operation: Schema.String,
  cause: Schema.Defect(),
}) {
  override get message() {
    return `Solana request failed: ${this.operation}`;
  }
}

// A token balance as getTransaction (jsonParsed) reports it.
interface TokenBalance {
  readonly owner?: string;
  readonly mint?: string;
  readonly uiTokenAmount?: { readonly uiAmountString?: string };
}

// The parts of a confirmed transaction a payment check reads.
export interface ChainTransaction {
  readonly meta: {
    readonly err: unknown;
    readonly preBalances: ReadonlyArray<number | string | bigint>;
    readonly postBalances: ReadonlyArray<number | string | bigint>;
    readonly preTokenBalances?: ReadonlyArray<TokenBalance> | null;
    readonly postTokenBalances?: ReadonlyArray<TokenBalance> | null;
  } | null;
  readonly transaction: {
    readonly message: {
      readonly accountKeys: ReadonlyArray<string | { readonly pubkey: string }>;
    };
  };
}

// Earn's on-chain checks for a payment a sponsor reports, its RPC and
// prices: the token a listing pays in, its USD price, and the transaction.
export class ReviewChain extends Context.Service<
  ReviewChain,
  {
    readonly token: (
      symbol: string | null,
    ) => Effect.Effect<PaymentToken | null, Database.DatabaseError>;
    // USD per token, when known.
    readonly price: (mintAddress: string) => Effect.Effect<number | undefined>;
    // null when the RPC has no such transaction.
    readonly transaction: (
      txId: string,
    ) => Effect.Effect<ChainTransaction | null, ChainError>;
  }
>()('earn/ReviewChain') {}

export interface PaymentCheck {
  readonly recipient: string;
  readonly expectedAmount: number;
  readonly token: PaymentToken;
  readonly tokenPriceUSD: number | undefined;
}

export type PaymentVerdict =
  | { readonly isValid: true; readonly actualAmount: number }
  | { readonly isValid: false; readonly error: string };

// 0.5% either way, in USD terms (which comes to 0.5% of the amount).
const TOLERANCE = 0.005;
const SYSTEM_PROGRAM = '11111111111111111111111111111111';
const LAMPORTS_PER_SOL = 1_000_000_000;

const keyOf = (key: string | { readonly pubkey: string } | undefined) =>
  typeof key === 'string' ? key : (key?.pubkey ?? '');

// Earn's validatePayment: the transaction succeeded, paid the recipient in
// the listing's token, and about the amount expected.
export function checkPayment(
  tx: ChainTransaction | null,
  { recipient, expectedAmount, token, tokenPriceUSD }: PaymentCheck,
): PaymentVerdict {
  if (!tx?.meta) return { isValid: false, error: 'Transaction not found' };
  const { meta } = tx;
  if (meta.err) {
    return { isValid: false, error: 'Transaction Errored on chain' };
  }
  const allowed =
    expectedAmount <= 0
      ? 0
      : tokenPriceUSD && tokenPriceUSD > 0
        ? (expectedAmount * tokenPriceUSD * TOLERANCE) / tokenPriceUSD
        : expectedAmount * TOLERANCE;
  const off = (actual: number) =>
    expectedAmount > 0 && Math.abs(actual - expectedAmount) > allowed;
  const wrongAmount = {
    isValid: false,
    error: "Transferred amount doesn't match the amount",
  } as const;

  const keys = tx.transaction.message.accountKeys;
  const nativeSol =
    !(meta.preTokenBalances?.length ?? 0) &&
    !(meta.postTokenBalances?.length ?? 0) &&
    keys.some((key) => keyOf(key) === SYSTEM_PROGRAM);
  if (nativeSol) {
    if (token.tokenSymbol !== 'SOL') {
      return {
        isValid: false,
        error: "Transferred token doesn't match the listing reward token",
      };
    }
    const index = meta.preBalances.findIndex(
      (pre, i) =>
        Number(meta.postBalances[i] ?? 0) - Number(pre) > 0 &&
        keyOf(keys[i]) === recipient,
    );
    if (index === -1) {
      return {
        isValid: false,
        error: "Recipient's public key doesn't match our records",
      };
    }
    const actual =
      Number(
        BigInt(meta.postBalances[index] ?? 0) -
          BigInt(meta.preBalances[index] ?? 0),
      ) / LAMPORTS_PER_SOL;
    return off(actual) ? wrongAmount : { isValid: true, actualAmount: actual };
  }

  const pre = meta.preTokenBalances?.find(
    (balance) => balance.owner === recipient,
  );
  const post = meta.postTokenBalances?.find(
    (balance) => balance.owner === recipient,
  );
  if (!post) {
    return {
      isValid: false,
      error: "Receiver's public key doesn't match our records",
    };
  }
  if (post.mint !== token.mintAddress) {
    return {
      isValid: false,
      error: "Transferred token doesn't match the listing reward token",
    };
  }
  const postAmount = post.uiTokenAmount?.uiAmountString;
  if (!postAmount) return wrongAmount;
  const actual =
    parseFloat(postAmount) -
    parseFloat(pre?.uiTokenAmount?.uiAmountString ?? '0');
  return off(actual) ? wrongAmount : { isValid: true, actualAmount: actual };
}

// Stablecoins are a dollar (Earn's /api/wallet/price).
const STABLE_MINTS = new Set([
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  '2u1tszSeqZ3qBWF3uNGPFc8TzMk2tdiwknnRMWGWjGWH',
]);

const RpcAnswer = Schema.Struct({ result: Schema.Unknown });
const Prices = Schema.Record(
  Schema.String,
  Schema.Struct({ usdPrice: Schema.Finite }),
);

const make = Effect.gen(function* () {
  const config = yield* AppConfig.AppConfig;
  const database = yield* Database.Database;
  const rpcHost = config.solana.rpcHost;
  const jupiterKey = config.jupiterApiKey;

  const token = Effect.fn('ReviewChain.token')(function* (
    symbol: string | null,
  ) {
    if (!symbol) return null;
    return yield* database.query('paymentToken', (client) =>
      client.tokenMetadata.findFirst({
        where: { tokenSymbol: symbol, isActive: true },
        select: { tokenSymbol: true, mintAddress: true, decimals: true },
      }),
    );
  });

  const price = (mintAddress: string) => {
    if (STABLE_MINTS.has(mintAddress)) return Effect.succeed(1);
    return Effect.tryPromise(async () => {
      if (!jupiterKey) throw new Error('Jupiter not configured');
      const response = await fetch(
        `https://api.jup.ag/price/v3?ids=${encodeURIComponent(mintAddress)}`,
        {
          headers: { 'x-api-key': Redacted.value(jupiterKey) },
          signal: AbortSignal.timeout(10_000),
        },
      );
      if (!response.ok) throw new Error(`Jupiter ${response.status}`);
      return (await response.json()) as unknown;
    }).pipe(
      Effect.flatMap(Schema.decodeUnknownEffect(Prices)),
      Effect.map((prices) => prices[mintAddress]?.usdPrice),
      // As Earn: no price, the fixed tolerance.
      Effect.catch(() =>
        Effect.logWarning('Token price unavailable').pipe(Effect.as(undefined)),
      ),
    );
  };

  const getTransaction = (txId: string) =>
    Effect.tryPromise({
      try: async () => {
        if (!rpcHost) throw new Error('RPC not configured');
        const response = await fetch(`https://${rpcHost}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'getTransaction',
            params: [
              txId,
              {
                commitment: 'confirmed',
                maxSupportedTransactionVersion: 0,
                encoding: 'jsonParsed',
              },
            ],
          }),
          signal: AbortSignal.timeout(20_000),
        });
        if (!response.ok) throw new Error(`RPC ${response.status}`);
        return (await response.json()) as unknown;
      },
      catch: (cause) => new ChainError({ operation: 'getTransaction', cause }),
    }).pipe(
      Effect.flatMap((body) =>
        Schema.decodeUnknownEffect(RpcAnswer)(body).pipe(
          Effect.mapError(
            (cause) => new ChainError({ operation: 'getTransaction', cause }),
          ),
        ),
      ),
      // The RPC's own shape; checkPayment reads it defensively.
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      Effect.map(({ result }) => (result ?? null) as ChainTransaction | null),
    );

  // Earn tries three times, five seconds apart.
  const transaction = (txId: string) =>
    getTransaction(txId).pipe(
      Effect.retry({ times: 2, schedule: Schedule.spaced('5 seconds') }),
    );

  return ReviewChain.of({ token, price, transaction });
});

export const layer = Layer.effect(ReviewChain, make);
