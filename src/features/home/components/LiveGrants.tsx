'use client';

import type { ReactNode } from 'react';

import { GrantsCardMini } from '@/features/grants/components/GrantsCardMini';
import type { GrantCardData } from '@/features/home/types/cards';

import { queryString, useJson } from '../hooks/use-json';

export const LiveGrants = ({
  children,
  excludeIds: ids,
}: {
  children: ReactNode;
  excludeIds?: string[];
}) => {
  const { data: grants } = useJson<Array<GrantCardData & { id: string }>>(
    `/api/grants/live/?${queryString({ take: 5, excludeIds: ids })}`,
  );
  return (
    <div>
      {children}
      <div className="mt-1 flex w-full flex-col">
        {grants?.map((grant) => (
          <GrantsCardMini grant={grant} key={grant?.id} />
        ))}
      </div>
    </div>
  );
};
