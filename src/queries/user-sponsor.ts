import { queryOptions } from '@tanstack/react-query';
import axios from 'axios';

const fetchUserSponsor = async () => {
  const { data } = await axios.get('/api/user-sponsors');
  return data;
};

export const userSponsorQuery = queryOptions({
  queryKey: ['userSponsors'],
  queryFn: fetchUserSponsor,
  enabled: false,
});
