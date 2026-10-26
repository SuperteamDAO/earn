import * as Schema from 'effect/Schema';
import type { NextRequest } from 'next/server';

import { runtime } from '@/server/runtime';

import { aiRoute, Description, ListingType } from '../respond';

const Body = Schema.Struct({
  description: Description,
  type: ListingType,
  token: Schema.String,
  tokenUsdValue: Schema.Finite,
});

const handle = aiRoute(
  Body,
  'Failed to generate rewards',
  (ai, sponsor, body) => ai.rewards(sponsor.userId, body),
);

export function POST(request: NextRequest) {
  return runtime.runPromise(handle(request));
}
