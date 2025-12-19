import { queryOptions } from '@tanstack/react-query';

import { api } from '@/lib/api';

import { type GrantApplicationWithUser } from '@/features/sponsor-dashboard/types';

export interface GrantApplicationsReturn {
  data: GrantApplicationWithUser[];
  count: number;
}

const fetchApplications = async (slug: string) => {
  const { data } = await api.get<GrantApplicationsReturn>(
    `/api/sponsor-dashboard/grants/${slug}/applications`,
  );
  return data;
};

export const applicationsQuery = (slug: string) =>
  queryOptions({
    queryKey: ['sponsor-applications', slug],
    queryFn: () => fetchApplications(slug),
  });
