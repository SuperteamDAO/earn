import * as Effect from 'effect/Effect';
import { NextResponse, type NextRequest } from 'next/server';

import { json, readerUser } from '@/lib/route-guard';
import * as Credits from '@/server/credits';
import { runtime } from '@/server/runtime';

// The signed-in account's submission credits left this month.
export function GET(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const writer = yield* readerUser(request);
      if (writer instanceof NextResponse) return writer;
      return yield* Credits.Credits.use((credits) =>
        credits.balance(writer.userId),
      ).pipe(
        Effect.map((balance) => json(200, { balance })),
        Effect.catchTag('DatabaseError', () =>
          Effect.succeed(json(500, { error: 'Internal Server Error' })),
        ),
      );
    }),
  );
}
