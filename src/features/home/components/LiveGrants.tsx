import { useQuery } from '@tanstack/react-query';
import { type ReactNode } from 'react';

import { GrantsCardMini } from '@/features/grants/components/GrantsCardMini';
import { grantsQuery } from '@/features/grants/queries/grants';

export const LiveGrants = ({
  children,
  excludeIds: ids,
}: {
  children: ReactNode;
  excludeIds?: string[];
}) => {
  const { data: grants } = useQuery(
    grantsQuery({
      take: 5,
      order: 'asc',
      excludeIds: ids ? ids : undefined,
    }),
  );
  return (
    <div>
      {children}
      <div className="mt-1 flex w-full flex-col">
        {grants?.slice(0, 5).map((grant) => {
          return <GrantsCardMini grant={grant} key={grant?.id} />;
        })}
      </div>
    </div>
  );
};
