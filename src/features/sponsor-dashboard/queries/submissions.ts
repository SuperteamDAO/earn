import { queryOptions } from '@tanstack/react-query';

import { type SubmissionWithUser } from '@/interface/submission';
import { api } from '@/lib/api';

const fetchSubmissions = async (
  slug: string,
  isHackathon?: boolean,
): Promise<SubmissionWithUser[]> => {
  const { data } = await api.get(`/api/sponsor-dashboard/${slug}/submissions`, {
    params: { isHackathon },
  });
  return data;
};

export const submissionsQuery = (slug: string, isHackathon?: boolean) =>
  queryOptions({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: ['sponsor-submissions', slug],
    queryFn: () => fetchSubmissions(slug, isHackathon),
    enabled: !!slug,
  });
