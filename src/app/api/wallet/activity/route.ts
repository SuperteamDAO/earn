import * as Effect from 'effect/Effect';
import { NextResponse, type NextRequest } from 'next/server';

import { json, readerUser } from '@/lib/route-guard';
import { runtime } from '@/server/runtime';
import * as Wallet from '@/server/wallet';

// The signed-in account's wallet activity, for the wallet page after a
// withdrawal.
export function GET(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const writer = yield* readerUser(request);
      if (writer instanceof NextResponse) return writer;
      return yield* Wallet.Wallet.use((wallet) =>
        wallet.activity(writer.userId),
      ).pipe(
        Effect.map((activity) => json(200, activity)),
        Effect.catchTag('NoWallet', () =>
          Effect.succeed(json(401, { error: 'Unauthorized' })),
        ),
        Effect.orElseSucceed(() =>
          json(500, { error: 'Failed to fetch activity' }),
        ),
      );
    }),
  );
}
