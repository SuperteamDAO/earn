import { useQuery } from '@tanstack/react-query';
import { type ReactNode } from 'react';

import { GrantsCardMini } from '@/features/grants/components/GrantsCardMini';
import { liveGrantsQuery } from '@/features/grants/queries/live-grants';

export const LiveGrants = ({
  children,
  excludeIds: ids,
}: {
  children: ReactNode;
  excludeIds?: string[];
}) => {
  const { data: grants } = useQuery(
    liveGrantsQuery({
      take: 5,
      excludeIds: ids ? ids : undefined,
    }),
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
