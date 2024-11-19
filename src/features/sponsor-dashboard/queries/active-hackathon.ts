import { type Hackathon } from '@prisma/client';
import { queryOptions } from '@tanstack/react-query';
import axios from 'axios';

import { getURL } from '@/utils';

export const fetchActiveHackathon = async (): Promise<Hackathon> => {
  const { data } = await axios.get(
    `${getURL()}api/sponsor-dashboard/active-hackathon/`,
  );
  return data;
};

export const activeHackathonQuery = () =>
  queryOptions({
    queryKey: ['active-hackathon'],
    queryFn: () => fetchActiveHackathon(),
    retry: false,
  });
