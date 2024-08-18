import { queryOptions } from '@tanstack/react-query';
import axios from 'axios';

import type { SubmissionWithUser } from '@/interface/submission';

interface Props {
  slug: string;
  searchText: string;
  skip: number;
  length: number;
  sponsorId: string;
}

export const submissionsQuery = ({
  slug,
  searchText,
  skip,
  length,
  sponsorId,
}: Props) =>
  queryOptions({
    queryKey: ['submissions', slug, searchText, skip, length],
    queryFn: async () => {
      const { data } = await axios.get<SubmissionWithUser[]>(
        `/api/sponsor-dashboard/${slug}/submissions`,
        {
          params: {
            searchText,
            take: length,
            skip,
          },
        },
      );
      return data;
    },
    enabled: !!sponsorId,
  });
