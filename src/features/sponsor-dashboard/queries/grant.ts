import { queryOptions } from '@tanstack/react-query';
import axios from 'axios';

import { type Grant } from '@/features/grants';

interface GrantWithApplicationCount extends Grant {
  totalApplications: number;
}

export const sponsorGrantQuery = (
  slug: string,
  currentSponsorId: string | undefined,
) =>
  queryOptions({
    queryKey: ['grant', slug],
    queryFn: async (): Promise<GrantWithApplicationCount> => {
      const response = await axios.get(
        `/api/sponsor-dashboard/grants/${slug}/`,
      );
      return response.data;
    },
    enabled: !!currentSponsorId,
  });
