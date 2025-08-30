import { queryOptions } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { type SubscribeBountyModel } from '@/prisma/models/SubscribeBounty';
import { type UserModel } from '@/prisma/models/User';

const fetchSubscriptions = async (
  id: string,
): Promise<(SubscribeBountyModel & { User: UserModel | null })[]> => {
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
