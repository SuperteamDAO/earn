import { queryOptions } from '@tanstack/react-query';

import { api } from '@/lib/api';

const isCreateListingAllowedFn = async (): Promise<boolean> => {
  const { data } = await api.get<{ allowed: boolean }>(
    `/api/sponsor-dashboard/listings/is-create-allowed`,
  );
  return data.allowed === true;
};

export const isCreateListingAllowedQuery = queryOptions({
  queryKey: ['isCreateListingAllowed'],
  queryFn: isCreateListingAllowedFn,
});
