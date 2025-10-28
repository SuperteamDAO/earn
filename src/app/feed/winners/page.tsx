import { Suspense } from 'react';

import { Feed } from '@/features/feed/components/Feed';

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

export default function FeedPage() {
  return (
    <Suspense fallback={<FeedPageFallback />}>
      <Feed isWinner />
    </Suspense>
  );
}
