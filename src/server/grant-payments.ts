import 'server-only';

import { createSolanaRpc, signature } from '@solana/kit';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Redacted from 'effect/Redacted';
import * as Schedule from 'effect/Schedule';
import * as Schema from 'effect/Schema';

import { Prisma } from '@/prisma/client';
import * as AppConfig from '@/server/app-config';
import * as Database from '@/server/database';

export class PriceUnavailable extends Schema.TaggedError<PriceUnavailable>()(
  'PriceUnavailable',
  { cause: Schema.Defect() },
) {
  override get message() {
    return 'Token price unavailable';
  }
}

export interface Token {
  readonly tokenSymbol: string;
  readonly mintAddress: string;
}

export interface PaymentCheck {
  readonly isValid: boolean;
  readonly error?: string;
}

// What a grant's payouts need from the chain and the token list: the
// token, its USD price (Jupiter, stables at 1), whether a transaction was
// already recorded, and whether it paid what it should have.
export class GrantPayments extends Context.Service<
  GrantPayments,
  {
    // Earn's getTokenBySymbol: an active token with that symbol.
    readonly token: (
      symbol: string | null,
    ) => Effect.Effect<Token | null, Database.DatabaseError>;
    readonly usdPrice: (
      mintAddress: string,
    ) => Effect.Effect<number, PriceUnavailable>;
    // Earn's findUsedPaymentTxIds for one transaction.
    readonly used: (
      txId: string,
    ) => Effect.Effect<boolean, Database.DatabaseError>;
    // Earn's validatePayment: the transaction paid the recipient about the
    // expected amount of the token (within 0.5%).
    readonly verify: (input: {
      readonly txId: string;
      readonly recipient: string;
      readonly amount: number;
      readonly token: Token;
      readonly usdPrice: number | undefined;
    }) => Effect.Effect<PaymentCheck>;
  }
>()('earn/GrantPayments') {}

const STABLE_MINTS = new Set<string>([
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  '2u1tszSeqZ3qBWF3uNGPFc8TzMk2tdiwknnRMWGWjGWH',
]);

const LAMPORTS_PER_SOL = 1_000_000_000n;
const USD_TOLERANCE = 0.005;
const SYSTEM_PROGRAM_ID = '11111111111111111111111111111111';

// A transaction link or bare signature, as Earn normalizes it.
export function normalizeTxId(txId: string): string {
  const trimmed = txId.trim();
  const path = URL.parse(trimmed)?.pathname ?? trimmed;
  return path.match(/\/tx\/([A-Za-z0-9]+)/)?.[1] ?? trimmed;
}

const escapeLike = (value: string) => value.replace(/[\\%_]/g, '\\$&');

type Json = Record<string, unknown>;
const isRecord = (value: unknown): value is Json =>
  typeof value === 'object' && value !== null;
const keyOf = (key: unknown) =>
  typeof key === 'string'
    ? key
    : isRecord(key) && typeof key.pubkey === 'string'
      ? key.pubkey
      : String(key);

// Earn's payment check on a parsed transaction.
function checkTransfer(
  tx: unknown,
  {
    recipient,
    amount,
    token,
    usdPrice,
  }: {
    readonly recipient: string;
    readonly amount: number;
    readonly token: Token;
    readonly usdPrice: number | undefined;
  },
): PaymentCheck {
  const allowed = (expected: number) => {
    if (expected <= 0) return 0;
    if (usdPrice && usdPrice > 0) {
      return (expected * usdPrice * USD_TOLERANCE) / usdPrice;
    }
    return expected * USD_TOLERANCE;
  };
  if (!isRecord(tx) || !isRecord(tx.meta)) {
    return { isValid: false, error: 'Transaction not found' };
  }
  const meta = tx.meta;
  if (meta.err)
    return { isValid: false, error: 'Transaction Errored on chain' };
  const message =
    isRecord(tx.transaction) && isRecord(tx.transaction.message)
      ? tx.transaction.message
      : {};
  const accountKeys = Array.isArray(message.accountKeys)
    ? message.accountKeys
    : [];
  const preTokens = Array.isArray(meta.preTokenBalances)
    ? meta.preTokenBalances.filter(isRecord)
    : [];
  const postTokens = Array.isArray(meta.postTokenBalances)
    ? meta.postTokenBalances.filter(isRecord)
    : [];
  const native =
    preTokens.length === 0 &&
    postTokens.length === 0 &&
    accountKeys.some((key) => keyOf(key) === SYSTEM_PROGRAM_ID);

  if (native) {
    if (token.tokenSymbol !== 'SOL') {
      return {
        isValid: false,
        error: "Transferred token doesn't match the listing reward token",
      };
    }
    const pre = Array.isArray(meta.preBalances) ? meta.preBalances : [];
    const post = Array.isArray(meta.postBalances) ? meta.postBalances : [];
    let index = -1;
    for (let i = 0; i < pre.length; i++) {
      const change = Number(post[i] || 0) - Number(pre[i] || 0);
      if (change > 0 && keyOf(accountKeys[i]) === recipient) {
        index = i;
        break;
      }
    }
    if (index === -1) {
      return {
        isValid: false,
        error: "Recipient's public key doesn't match our records",
      };
    }
    const actual =
      Number(
        BigInt(String(post[index] || 0)) - BigInt(String(pre[index] || 0)),
      ) / Number(LAMPORTS_PER_SOL);
    if (amount > 0 && Math.abs(actual - amount) > allowed(amount)) {
      return {
        isValid: false,
        error: "Transferred amount doesn't match the amount",
      };
    }
    return { isValid: true };
  }

  const preBalance = preTokens.find((balance) => balance.owner === recipient);
  const postBalance = postTokens.find((balance) => balance.owner === recipient);
  if (!postBalance) {
    return {
      isValid: false,
      error: "Receiver's public key doesn't match our records",
    };
  }
  if (postBalance.mint !== token.mintAddress) {
    return {
      isValid: false,
      error: "Transferred token doesn't match the listing reward token",
    };
  }
  const uiAmount = (balance: Json | undefined) =>
    balance && isRecord(balance.uiTokenAmount)
      ? balance.uiTokenAmount.uiAmountString
      : undefined;
  const postAmount = uiAmount(postBalance);
  if (typeof postAmount !== 'string') {
    return {
      isValid: false,
      error: "Transferred amount doesn't match the amount",
    };
  }
  const preAmount = uiAmount(preBalance);
  const actual =
    Number.parseFloat(postAmount) -
    Number.parseFloat(typeof preAmount === 'string' ? preAmount : '0');
  if (amount > 0 && Math.abs(actual - amount) > allowed(amount)) {
    return {
      isValid: false,
      error: "Transferred amount doesn't match the amount",
    };
  }
  return { isValid: true };
}

const make = Effect.gen(function* () {
  const config = yield* AppConfig.AppConfig;
  const database = yield* Database.Database;
  const rpc = config.solana.rpcHost
    ? createSolanaRpc(`https://${config.solana.rpcHost}`)
    : null;

  const token = Effect.fn('GrantPayments.token')(function* (
    symbol: string | null,
  ) {
    if (!symbol) return null;
    return yield* database.query('tokenBySymbol', (client) =>
      client.tokenMetadata.findFirst({
        where: { tokenSymbol: symbol, isActive: true },
        select: { tokenSymbol: true, mintAddress: true },
      }),
    );
  });

  const usdPrice = (mintAddress: string) =>
    STABLE_MINTS.has(mintAddress)
      ? Effect.succeed(1)
      : Effect.tryPromise({
          try: async () => {
            const key = config.jupiterApiKey;
            if (!key) throw new Error('Jupiter not configured');
            const response = await fetch(
              `https://api.jup.ag/price/v3?ids=${encodeURIComponent(mintAddress)}`,
              {
                headers: { 'x-api-key': Redacted.value(key) },
                signal: AbortSignal.timeout(10_000),
              },
            );
            if (!response.ok) throw new Error(`Jupiter ${response.status}`);
            const body: unknown = await response.json();
            const entry = isRecord(body) ? body[mintAddress] : undefined;
            const price = isRecord(entry) ? entry.usdPrice : undefined;
            if (typeof price !== 'number') throw new Error('No price');
            return price;
          },
          catch: (cause) => new PriceUnavailable({ cause }),
        });

  const used = Effect.fn('GrantPayments.used')(function* (txId: string) {
    const id = normalizeTxId(txId);
    if (!id) return false;
    const escaped = escapeLike(id);
    const patterns = [
      escaped,
      `%/tx/${escaped}`,
      `%/tx/${escaped}?%`,
      `%/tx/${escaped}#%`,
      `%/tx/${escaped}/%`,
    ];
    const exists = (table: 'GrantApplication' | 'Submission') =>
      Prisma.sql`EXISTS (
        SELECT 1 FROM ${Prisma.raw(`\`${table}\``)}
        WHERE paymentDetails IS NOT NULL AND (${Prisma.join(
          patterns.map(
            (pattern) =>
              Prisma.sql`JSON_SEARCH(JSON_EXTRACT(paymentDetails, '$[*].txId'), 'one', ${pattern}) IS NOT NULL`,
          ),
          ' OR ',
        )})
        LIMIT 1
      )`;
    const rows = yield* database.query('usedPaymentTx', (client) =>
      client.$queryRaw<Array<{ txId: string }>>(
        Prisma.sql`SELECT ${id} AS txId WHERE ${exists('Submission')} OR ${exists('GrantApplication')}`,
      ),
    );
    return rows.length > 0;
  });

  const verify = ({
    txId,
    recipient,
    amount,
    token: paid,
    usdPrice: price,
  }: {
    readonly txId: string;
    readonly recipient: string;
    readonly amount: number;
    readonly token: Token;
    readonly usdPrice: number | undefined;
  }) =>
    Effect.gen(function* () {
      if (!rpc) {
        return { isValid: false, error: "Couldn't fetch transaction details" };
      }
      // Three tries, five seconds apart, as Earn.
      const tx = yield* Effect.tryPromise(() =>
        rpc
          .getTransaction(signature(txId), {
            commitment: 'confirmed',
            maxSupportedTransactionVersion: 0,
            encoding: 'jsonParsed',
          })
          .send(),
      ).pipe(
        Effect.retry({ times: 2, schedule: Schedule.spaced('5 seconds') }),
        Effect.option,
      );
      if (tx._tag === 'None') {
        return { isValid: false, error: "Couldn't fetch transaction details" };
      }
      return checkTransfer(tx.value, {
        recipient,
        amount,
        token: paid,
        usdPrice: price,
      });
    }).pipe(
      Effect.catchDefect((defect) =>
        Effect.succeed({
          isValid: false,
          error:
            defect instanceof Error ? defect.message : 'Invalid transaction',
        }),
      ),
    );

  return GrantPayments.of({ token, usdPrice, used, verify });
});

export const layer = Layer.effect(GrantPayments, make);
