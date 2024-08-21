import { queryOptions } from '@tanstack/react-query';
import axios from 'axios';

import { type SponsorType } from '@/interface/sponsor';

const fetchSponsorData = async (): Promise<SponsorType> => {
  const { data } = await axios.get('/api/sponsors/');
  return data;
};

export const sponsorQuery = (currentSponsorId: string | undefined) =>
  queryOptions({
    queryKey: ['sponsorData', currentSponsorId],
    queryFn: fetchSponsorData,
    enabled: !!currentSponsorId,
  });
