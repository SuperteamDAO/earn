import { queryOptions } from '@tanstack/react-query';

import { type SubmissionWithUser } from '@/interface/submission';
import { api } from '@/lib/api';

interface ApplicationsParams {
  id?: string;
}

const fetchUnreviewedSubmissions = async (
  params: ApplicationsParams,
): Promise<SubmissionWithUser[]> => {
  const { data } = await api.get(
    `/api/sponsor-dashboard/submissions/ai/unreviewed`,
    { params },
  );
  return data;
};

export const unreviewedSubmissionsQuery = (
  params: ApplicationsParams,
  slug?: string,
) =>
  queryOptions({
    queryKey: ['unreviewed-applications', slug, params],
    queryFn: () => fetchUnreviewedSubmissions(params),
    enabled: !!slug && !!params.id,
  });
