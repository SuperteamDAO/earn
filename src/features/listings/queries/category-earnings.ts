import { queryOptions } from '@tanstack/react-query';
import axios from 'axios';

import { type CategoryKeys } from '@/pages/api/listings/category-earnings';

type CategoryEarningsResponse = {
  totalEarnings: number;
};

const fetchCategoryEarnings = async (filter: CategoryKeys) => {
  const response = await axios.get<CategoryEarningsResponse>(
    `/api/listings/category-earnings?filter=${filter}`,
  );
  return response.data;
};

export const categoryEarningsQuery = (filter: CategoryKeys) =>
  queryOptions({
    queryKey: ['categoryEarnings', filter],
    queryFn: () => fetchCategoryEarnings(filter),
    staleTime: 24 * 60 * 60 * 1000, // 1 day
    gcTime: 24 * 60 * 60 * 1000,
  });
