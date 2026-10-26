import * as Clock from 'effect/Clock';
import * as Effect from 'effect/Effect';

import { json } from '@/lib/route-guard';
import { runtime } from '@/server/runtime';

// Never prerendered: it's now, every time.
export const dynamic = 'force-dynamic';

// The server's clock, for countdowns and deadlines (useServerTimeSync).
export function GET() {
  return runtime.runPromise(
    Clock.currentTimeMillis.pipe(
      Effect.map((timestamp) =>
        json(200, {
          timestamp,
          iso: new Date(timestamp).toISOString(),
          timezone: 'UTC',
        }),
      ),
    ),
  );
}
