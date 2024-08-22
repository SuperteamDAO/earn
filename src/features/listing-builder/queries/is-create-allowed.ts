import { queryOptions } from '@tanstack/react-query';
import axios from 'axios';

const isCreateListingAllowedFn = async (): Promise<boolean> => {
  const { data } = await axios.get<{ allowed: boolean }>(
    `/api/sponsor-dashboard/listings/is-create-allowed`,
  );
  return data.allowed === true;
};

export const isCreateListingAllowedQuery = queryOptions({
  queryKey: ['isCreateListingAllowed'],
  queryFn: isCreateListingAllowedFn,
});
