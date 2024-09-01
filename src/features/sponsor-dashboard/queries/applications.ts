import { queryOptions } from '@tanstack/react-query';
import axios from 'axios';

import { type GrantApplicationWithUser } from '@/features/sponsor-dashboard';

interface ApplicationsParams {
  searchText: string;
  length: number;
  skip: number;
}

const fetchApplications = async (
  params: ApplicationsParams,
  slug: string,
): Promise<GrantApplicationWithUser[]> => {
  const { data } = await axios.get(
    `/api/sponsor-dashboard/grants/${slug}/applications/`,
    { params },
  );
  return data;
};

export const applicationsQuery = (params: ApplicationsParams, slug: string) =>
  queryOptions({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: ['sponsor-applications', slug],
    queryFn: () => fetchApplications(params, slug),
  });
