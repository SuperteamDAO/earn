import 'server-only';

import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as Redacted from 'effect/Redacted';
import * as Schema from 'effect/Schema';

import * as AppConfig from '@/server/app-config';

export class PrivyApiError extends Schema.TaggedError<PrivyApiError>()(
  'PrivyApiError',
  {
    operation: Schema.String,
    status: Schema.optional(Schema.Finite),
  },
) {
  override get message() {
    return `Privy ${this.operation} failed${this.status ? ` (${this.status})` : ''}`;
  }
}

const Wallet = Schema.Struct({ address: Schema.String });

// Privy's server API over plain HTTP, with Earn's app secret, as Earn's
// `@privy-io/node` client called it (its SDK loads only on Privy pages).
export class PrivyApi extends Context.Service<
  PrivyApi,
  {
    // Makes a Solana wallet owned by this Privy user (Earn's embedded
    // wallet, where rewards are paid). Succeeds with its address.
    readonly createSolanaWallet: (
      privyDid: string,
    ) => Effect.Effect<string, PrivyApiError>;
  }
>()('earn/PrivyApi') {}

const make = Effect.gen(function* () {
  const config = yield* AppConfig.AppConfig;
  const { appId, appSecret } = config.privy;

  const createSolanaWallet = Effect.fn('PrivyApi.createSolanaWallet')(
    function* (privyDid: string) {
      const operation = 'createWallet';
      if (!appSecret) return yield* new PrivyApiError({ operation });
      const basic = Buffer.from(
        `${appId}:${Redacted.value(appSecret)}`,
      ).toString('base64');
      const response = yield* Effect.tryPromise({
        try: () =>
          fetch('https://api.privy.io/v1/wallets', {
            method: 'POST',
            headers: {
              Authorization: `Basic ${basic}`,
              'privy-app-id': appId,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chain_type: 'solana',
              owner: { user_id: privyDid },
            }),
            signal: AbortSignal.timeout(15_000),
          }),
        catch: () => new PrivyApiError({ operation }),
      });
      if (!response.ok) {
        return yield* new PrivyApiError({ operation, status: response.status });
      }
      const body: unknown = yield* Effect.promise(() =>
        response.json().catch((): unknown => null),
      );
      const wallet = Schema.decodeUnknownOption(Wallet)(body);
      if (Option.isNone(wallet)) {
        return yield* new PrivyApiError({ operation });
      }
      return wallet.value.address;
    },
  );

  return PrivyApi.of({ createSolanaWallet });
});

export const layer = Layer.effect(PrivyApi, make);
