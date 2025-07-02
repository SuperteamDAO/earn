import { type SubscribeBounty, type User } from '@prisma/client';
import { queryOptions } from '@tanstack/react-query';

import { api } from '@/lib/api';

const fetchSubscriptions = async (
  id: string,
): Promise<(SubscribeBounty & { User: User | null })[]> => {
  const { data } = await api.get('/api/listings/notifications/status', {
    params: { listingId: id },
  });
  return data;
};

export const listingSubscriptionsQuery = (id: string) =>
  queryOptions({
    queryKey: ['subscriptions', id],
    queryFn: () => fetchSubscriptions(id),
  });
