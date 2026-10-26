import * as Effect from 'effect/Effect';
import type { NextRequest } from 'next/server';

import { json } from '@/lib/route-guard';
import { runtime } from '@/server/runtime';
import * as WalletPrices from '@/server/wallet-prices';

// A token's dollar price (`?mintAddress=`), from Jupiter. Public: the
// listing builder and other servers ask it too.
export function GET(request: NextRequest) {
  const mintAddress = request.nextUrl.searchParams.get('mintAddress');
  if (!mintAddress) {
    return json(400, { error: 'Mint address is required' });
  }
  return runtime.runPromise(
    WalletPrices.WalletPrices.use((prices) => prices.usd(mintAddress)).pipe(
      Effect.map((price) => json(200, { price })),
      Effect.catchTags({
        PriceNotFound: (error) =>
          Effect.succeed(json(404, { error: error.message })),
        PriceUnavailable: (error) =>
          Effect.succeed(
            error.reason === 'config'
              ? json(500, { error: 'Jupiter API key is not configured' })
              : json(500, { error: 'Failed to fetch token price' }),
          ),
      }),
    ),
  );
}
