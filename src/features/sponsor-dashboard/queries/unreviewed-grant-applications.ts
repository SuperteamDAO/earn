import { queryOptions } from '@tanstack/react-query';

import { api } from '@/lib/api';

import { type GrantApplicationWithUser } from '@/features/sponsor-dashboard/types';

interface ApplicationsParams {
  id?: string;
}

const fetchUnreviewedGrantApplications = async (
  params: ApplicationsParams,
): Promise<GrantApplicationWithUser[]> => {
  const { data } = await api.get(
    `/api/sponsor-dashboard/grant-application/ai/unreviewed`,
    { params },
  );
  return data;
};

export const unreviewedGrantApplicationsQuery = (
  params: ApplicationsParams,
  slug?: string,
) =>
  queryOptions({
    queryKey: ['unreviewed-applications', slug, params],
    queryFn: () => fetchUnreviewedGrantApplications(params),
    enabled: !!slug && !!params.id,
  });
