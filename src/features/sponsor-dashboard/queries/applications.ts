import {
  type GrantApplicationStatus,
  type SubmissionLabels,
} from '@prisma/client';
import { queryOptions } from '@tanstack/react-query';
import axios from 'axios';

import { type GrantApplicationWithUser } from '@/features/sponsor-dashboard';

interface ApplicationsParams {
  searchText: string;
  length: number;
  skip: number;
  filterLabel: SubmissionLabels | GrantApplicationStatus | undefined;
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

export const applicationsQuery = (slug: string, params: ApplicationsParams) =>
  queryOptions({
    queryKey: ['sponsor-applications', slug, params],
    queryFn: () => fetchApplications(params, slug),
  });
