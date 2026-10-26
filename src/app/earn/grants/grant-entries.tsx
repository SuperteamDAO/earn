'use client';

import { GrantEntry } from '@/features/grants/components/GrantEntry';
import type { GrantCardData } from '@/features/home/types/cards';

// The grants page's cards (GrantEntry reads the token list, a client
// context).
export function GrantEntries({
  grants,
}: {
  readonly grants: ReadonlyArray<GrantCardData & { readonly id: string }>;
}) {
  return (
    <>
      {grants.map((grant) => (
        <div key={grant.id} className="w-full max-w-[20rem]">
          <GrantEntry
            title={grant.title}
            slug={grant.slug}
            minReward={grant.minReward ?? undefined}
            maxReward={grant.maxReward ?? undefined}
            token={grant.token ?? undefined}
            logo={grant.logo ?? undefined}
          />
        </div>
      ))}
    </>
  );
}
