import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

import { type GrantApplicationWithUser } from '@/features/sponsor-dashboard';

interface UseApplicationsParams {
  slug: string;
  searchText: string;
  length: number;
  skip: number;
  enabled: boolean;
}

export const useApplications = ({
  slug,
  searchText,
  length,
  skip,
  enabled,
}: UseApplicationsParams) => {
  return useQuery({
    queryKey: ['applications', slug, searchText, length, skip],
    queryFn: async () => {
      const { data } = await axios.get(
        `/api/sponsor-dashboard/grants/${slug}/applications/`,
        {
          params: { searchText, take: length, skip },
        },
      );
      return data as GrantApplicationWithUser[];
    },
    enabled,
  });
};
