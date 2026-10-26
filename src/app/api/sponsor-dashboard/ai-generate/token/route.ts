import * as Schema from 'effect/Schema';
import type { NextRequest } from 'next/server';

import { runtime } from '@/server/runtime';

import { aiRoute, Description } from '../respond';

const Body = Schema.Struct({ description: Description });

const handle = aiRoute(Body, 'Failed to generate token', (ai, sponsor, body) =>
  ai.token(sponsor.userId, body.description),
);

export function POST(request: NextRequest) {
  return runtime.runPromise(handle(request));
}
