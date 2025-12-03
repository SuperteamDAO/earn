import { useQuery } from '@tanstack/react-query';
import { type z } from 'zod';

import { api } from '@/lib/api';

import { type GrantContextSchema } from '../constants/schema';
import { type GrantWithApplicationCount } from '../types';

export type GrantContext = z.infer<typeof GrantContextSchema>;

interface GrantsParams {
  context: GrantContext;
  category: string;
  region?: string;
  sponsor?: string;
  skill?: string;
}

const fetchGrants = async ({
  context,
  category,
  region = '',
  sponsor = '',
  skill = '',
}: GrantsParams): Promise<GrantWithApplicationCount[]> => {
  const queryParams = new URLSearchParams({
    context,
    category,
    region,
    sponsor,
  });

  if (skill) {
    queryParams.set('skill', skill);
  }

  const { data } = await api.get(`/api/grants?${queryParams.toString()}`);

  return data;
};

export function useGrants({
  context,
  category,
  region,
  sponsor,
  skill,
}: GrantsParams) {
  return useQuery({
    queryKey: ['grants', context, category, region, sponsor, skill],
    queryFn: () =>
      fetchGrants({
        context,
        category,
        region,
        sponsor,
        skill,
      }),
  });
}
