import * as Effect from 'effect/Effect';
import { NextResponse, type NextRequest } from 'next/server';

import { json, readerUser } from '@/lib/route-guard';
import * as CreditHistory from '@/server/credit-history';
import { runtime } from '@/server/runtime';

// The signed-in account's credit history, for the credit drawer.
export function GET(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const writer = yield* readerUser(request);
      if (writer instanceof NextResponse) return writer;
      return yield* CreditHistory.CreditHistory.use((credits) =>
        credits.history(writer.userId),
      ).pipe(
        Effect.map((entries) => json(200, entries)),
        Effect.catchTag('DatabaseError', () =>
          Effect.succeed(
            json(500, {
              error: 'Error occurred while processing the request.',
            }),
          ),
        ),
      );
    }),
  );
}
