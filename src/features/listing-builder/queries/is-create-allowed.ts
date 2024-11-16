import { queryOptions } from '@tanstack/react-query';
import axios from 'axios';

interface CreateListingAllowedResponse {
  allowed: boolean;
  isActive: boolean;
}

const isCreateListingAllowedFn =
  async (): Promise<CreateListingAllowedResponse> => {
    const { data } = await axios.get<CreateListingAllowedResponse>(
      `/api/sponsor-dashboard/listings/is-create-allowed`,
    );
    return {
      allowed: data.allowed === true,
      isActive: data.isActive === true,
    };
  };

export const isCreateListingAllowedQuery = queryOptions({
  queryKey: ['isCreateListingAllowed'],
  queryFn: isCreateListingAllowedFn,
});
