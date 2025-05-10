import { useQuery } from '@tanstack/react-query';
import { type z } from 'zod';

import { api } from '@/lib/api';

import { type Listing } from '../../listings/types';
import {
  type HackathonContextSchema,
  type HackathonOrderDirectionSchema,
  type HackathonSchema,
  type HackathonSortOptionSchema,
  type HackathonStatusSchema,
} from '../constants/schema';

export type HackathonName = z.infer<typeof HackathonSchema>;
export type HackathonStatus = z.infer<typeof HackathonStatusSchema>;
export type HackathonSortOption = z.infer<typeof HackathonSortOptionSchema>;
export type HackathonOrderDirection = z.infer<
  typeof HackathonOrderDirectionSchema
>;
export type HackathonContext = z.infer<typeof HackathonContextSchema>;

interface HackathonParams {
  context: HackathonContext;
  name: string;
  status?: HackathonStatus;
  sortBy?: HackathonSortOption;
  order?: HackathonOrderDirection;
}

const fetchHackathons = async ({
  context,
  name,
  status = 'open',
  sortBy = 'Prize',
  order = 'desc',
}: HackathonParams): Promise<Listing[]> => {
  const queryParams = new URLSearchParams({
    context,
    name,
    status,
    sortBy,
    order,
  });

  const { data } = await api.get(`/api/hackathon?${queryParams.toString()}`);

  return data;
};

export function useHackathons({
  context,
  name,
  status,
  sortBy,
  order,
}: HackathonParams) {
  return useQuery({
    queryKey: ['hackathons', context, name, status, sortBy, order],
    queryFn: () =>
      fetchHackathons({
        context,
        name,
        status,
        sortBy,
        order,
      }),
  });
}
