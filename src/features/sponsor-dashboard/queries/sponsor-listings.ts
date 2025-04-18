import { queryOptions } from '@tanstack/react-query';

import { api } from '@/lib/api';

import { type Listing } from '@/features/listings/types';

interface Listings {
  bounties: Listing[];
}

interface Props {
  sponsor: string;
  type?: 'bounty' | 'sponsorship' | 'project' | 'hackathon';
}

const fetchListings = async (props: Props): Promise<Listings> => {
  const { data } = await api.post(`/api/listings/sponsor`, {
    ...props,
  });
  return data;
};

export const sponsorListingsQuery = (props: Props) =>
  queryOptions({
    queryKey: ['sponsorListings', props],
    queryFn: () => fetchListings(props),
    enabled: !!props.sponsor,
  });
