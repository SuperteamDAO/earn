import * as Schema from 'effect/Schema';
import type { NextRequest } from 'next/server';

import { runtime } from '@/server/runtime';

import { aiRoute, Description, ListingType } from '../respond';

const Body = Schema.Struct({ description: Description, type: ListingType });

const handle = aiRoute(Body, 'Failed to generate title', (ai, sponsor, body) =>
  ai.title(sponsor.userId, body.description, body.type),
);

export function POST(request: NextRequest) {
  return runtime.runPromise(handle(request));
}
