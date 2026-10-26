import 'server-only';

import { TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import { TOKEN_2022_PROGRAM_ADDRESS } from '@solana-program/token-2022';
import {
  createSolanaRpc,
  type Address,
  type Base64EncodedWireTransaction,
  type Blockhash,
  type Signature,
} from '@solana/kit';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Schema from 'effect/Schema';

import * as AppConfig from '@/server/app-config';

export class WalletRpcError extends Schema.TaggedError<WalletRpcError>()(
  'WalletRpcError',
  { operation: Schema.String, cause: Schema.Defect() },
) {
  override get message() {
    return `Solana RPC failed: ${this.operation}`;
  }
}

// No RPC host configured: the wallet can't be read at all.
export class WalletRpcUnavailable extends Schema.TaggedError<WalletRpcUnavailable>()(
  'WalletRpcUnavailable',
  {},
) {
  override get message() {
    return 'Solana RPC is not configured';
  }
}

export type RpcFailure = WalletRpcError | WalletRpcUnavailable;

export interface TokenAccount {
  readonly mint: string;
  // Base units, and the mint's decimals.
  readonly amount: bigint;
  readonly decimals: number;
}

export interface LatestBlockhash {
  readonly blockhash: Blockhash;
  readonly lastValidBlockHeight: bigint;
}

export interface SignatureStatus {
  readonly failed: boolean;
  readonly confirmationStatus: string | null;
}

// What the wallet's activity reads of a parsed transaction.
export interface ParsedTransaction {
  readonly blockTime: number | null;
  readonly accountKeys: ReadonlyArray<string>;
  readonly preBalances: ReadonlyArray<bigint>;
  readonly postBalances: ReadonlyArray<bigint>;
  // null when the node didn't record them.
  readonly preTokenBalances: ReadonlyArray<TokenBalance> | null;
  readonly postTokenBalances: ReadonlyArray<TokenBalance> | null;
  // Top-level instructions the node could parse.
  readonly instructions: ReadonlyArray<ParsedInstruction>;
}

export interface TokenBalance {
  readonly accountIndex: number;
  readonly mint: string;
  readonly owner: string | null;
  readonly uiAmountString: string | null;
}

export interface ParsedInstruction {
  readonly program: string | null;
  readonly type: string | null;
  readonly source: string | null;
  readonly destination: string | null;
}

// The RPC calls Earn's wallet makes, against Earn's RPC (Helius), with plain
// results so tests can stand in for the network.
export class WalletRpc extends Context.Service<
  WalletRpc,
  {
    readonly lamports: (owner: Address) => Effect.Effect<bigint, RpcFailure>;
    // Token and Token-2022 accounts.
    readonly tokenAccounts: (
      owner: Address,
    ) => Effect.Effect<ReadonlyArray<TokenAccount>, RpcFailure>;
    // The program that owns an account; null when it doesn't exist.
    readonly accountOwner: (
      account: Address,
    ) => Effect.Effect<string | null, RpcFailure>;
    readonly latestBlockhash: Effect.Effect<LatestBlockhash, RpcFailure>;
    readonly send: (
      transaction: Base64EncodedWireTransaction,
    ) => Effect.Effect<Signature, RpcFailure>;
    // null when the network hasn't seen it (yet).
    readonly status: (
      signature: Signature,
    ) => Effect.Effect<SignatureStatus | null, RpcFailure>;
    readonly signatures: (
      owner: Address,
      limit: number,
    ) => Effect.Effect<ReadonlyArray<string>, RpcFailure>;
    // null when the node has no such transaction or no metadata for it.
    readonly transaction: (
      signature: string,
    ) => Effect.Effect<ParsedTransaction | null, RpcFailure>;
  }
>()('earn/WalletRpc') {}

const str = (value: unknown): string | null =>
  typeof value === 'string' ? value : null;

const record = (value: unknown): Record<string, unknown> | null =>
  typeof value === 'object' && value !== null
    ? // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      (value as Record<string, unknown>)
    : null;

const parsedInstruction = (instruction: unknown): ParsedInstruction | null => {
  const raw = record(instruction);
  const parsed = record(raw?.parsed);
  if (!raw || !parsed) return null;
  const info = record(parsed.info);
  return {
    program: str(raw.program),
    type: str(parsed.type),
    source: str(info?.source),
    destination: str(info?.destination),
  };
};

const tokenBalances = (
  list:
    | ReadonlyArray<{
        readonly accountIndex: number;
        readonly mint: string;
        readonly owner?: string;
        readonly uiTokenAmount: { readonly uiAmountString?: string };
      }>
    | null
    | undefined,
): ReadonlyArray<TokenBalance> | null =>
  list
    ? list.map((balance) => ({
        accountIndex: balance.accountIndex,
        mint: balance.mint,
        owner: balance.owner ?? null,
        uiAmountString: balance.uiTokenAmount.uiAmountString ?? null,
      }))
    : null;

const make = Effect.gen(function* () {
  const config = yield* AppConfig.AppConfig;
  const host = config.solana.rpcHost;
  // Earn stores the host without its scheme.
  const rpc = host ? createSolanaRpc(`https://${host}`) : null;

  // Every call goes through here: typed, named, and refused outright when
  // there's no RPC. Never logs the URL, which carries its key.
  const call = <A>(
    operation: string,
    run: (client: NonNullable<typeof rpc>) => Promise<A>,
  ): Effect.Effect<A, RpcFailure> =>
    rpc
      ? Effect.tryPromise({
          try: () => run(rpc),
          catch: (cause) => new WalletRpcError({ operation, cause }),
        }).pipe(Effect.withSpan(`WalletRpc.${operation}`))
      : Effect.fail(new WalletRpcUnavailable());

  const lamports = (owner: Address) =>
    call('getBalance', (client) => client.getBalance(owner).send()).pipe(
      Effect.map((result) => result.value),
    );

  const tokenAccounts = (owner: Address) =>
    Effect.forEach(
      [TOKEN_PROGRAM_ADDRESS, TOKEN_2022_PROGRAM_ADDRESS],
      (programId) =>
        call('getTokenAccountsByOwner', (client) =>
          client
            .getTokenAccountsByOwner(
              owner,
              { programId },
              { encoding: 'jsonParsed', commitment: 'confirmed' },
            )
            .send(),
        ),
      { concurrency: 'unbounded' },
    ).pipe(
      Effect.map((results) =>
        results.flatMap((result) =>
          result.value.map((account): TokenAccount => {
            const { mint, tokenAmount } = account.account.data.parsed.info;
            return {
              mint,
              amount: BigInt(tokenAmount.amount),
              decimals: tokenAmount.decimals,
            };
          }),
        ),
      ),
    );

  const accountOwner = (account: Address) =>
    call('getAccountInfo', (client) =>
      client.getAccountInfo(account, { encoding: 'base64' }).send(),
    ).pipe(Effect.map((result) => result.value?.owner ?? null));

  const latestBlockhash = call('getLatestBlockhash', (client) =>
    client.getLatestBlockhash({ commitment: 'finalized' }).send(),
  ).pipe(Effect.map((result): LatestBlockhash => result.value));

  const send = (transaction: Base64EncodedWireTransaction) =>
    call('sendTransaction', (client) =>
      client
        .sendTransaction(transaction, {
          skipPreflight: false,
          encoding: 'base64',
        })
        .send(),
    );

  const status = (signature: Signature) =>
    call('getSignatureStatuses', (client) =>
      client.getSignatureStatuses([signature]).send(),
    ).pipe(
      Effect.map((result): SignatureStatus | null => {
        const found = result.value[0];
        if (!found) return null;
        return {
          failed: found.err !== null,
          confirmationStatus: found.confirmationStatus ?? null,
        };
      }),
    );

  const signatures = (owner: Address, limit: number) =>
    call('getSignaturesForAddress', (client) =>
      client.getSignaturesForAddress(owner, { limit }).send(),
    ).pipe(Effect.map((list) => list.map((entry) => String(entry.signature))));

  const transaction = (signature: string) =>
    call('getTransaction', (client) =>
      client
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion
        .getTransaction(signature as Signature, {
          maxSupportedTransactionVersion: 0,
          commitment: 'confirmed',
          encoding: 'jsonParsed',
        })
        .send(),
    ).pipe(
      Effect.map((tx): ParsedTransaction | null => {
        if (!tx?.meta) return null;
        return {
          blockTime: tx.blockTime === null ? null : Number(tx.blockTime),
          accountKeys: tx.transaction.message.accountKeys.map((key) =>
            String(key.pubkey),
          ),
          preBalances: tx.meta.preBalances.map(BigInt),
          postBalances: tx.meta.postBalances.map(BigInt),
          preTokenBalances: tokenBalances(tx.meta.preTokenBalances),
          postTokenBalances: tokenBalances(tx.meta.postTokenBalances),
          instructions: tx.transaction.message.instructions.flatMap(
            (instruction) => {
              const parsed = parsedInstruction(instruction);
              return parsed ? [parsed] : [];
            },
          ),
        };
      }),
    );

  return WalletRpc.of({
    lamports,
    tokenAccounts,
    accountOwner,
    latestBlockhash,
    send,
    status,
    signatures,
    transaction,
  });
});

export const layer = Layer.effect(WalletRpc, make);
