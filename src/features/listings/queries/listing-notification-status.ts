import { queryOptions } from '@tanstack/react-query';

import {
  type SubscribeBountyModel,
  type UserModel,
} from '@/interface/prisma/models';
import { api } from '@/lib/api';

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
