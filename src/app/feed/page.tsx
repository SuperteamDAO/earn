import { Suspense } from 'react';
import { z } from 'zod';

import { Feed } from '@/features/feed/components/Feed';
import { type FeedPostType, FeedPostTypeSchema } from '@/features/feed/types';

interface SearchParams {
  type?: string;
  id?: string;
}

interface Props {
  searchParams: Promise<SearchParams>;
}

const UUIDSchema = z.string().uuid();

function FeedPageFallback() {
  return (
    <div className="min-h-screen w-full bg-white">
      <div className="mx-auto w-full max-w-4xl px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-slate-200" />
          <div className="h-4 w-64 rounded bg-slate-200" />
          <div className="mt-8 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-64 w-full rounded-lg bg-slate-200" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function FeedPage({ searchParams }: Props) {
  const params = await searchParams;

  let type: FeedPostType | undefined = undefined;
  let id: string | undefined = undefined;

  if (
    typeof params.type === 'string' &&
    FeedPostTypeSchema.safeParse(params.type).success
  ) {
    type = params.type as FeedPostType;
  }

  if (
    typeof params.id === 'string' &&
    UUIDSchema.safeParse(params.id).success
  ) {
    id = params.id;
  }

  return (
    <Suspense fallback={<FeedPageFallback />}>
      <Feed id={id} type={type} />
    </Suspense>
  );
}
