import { queryOptions } from '@tanstack/react-query';
import axios from 'axios';

export const fetchUserApplicationStatus = async (grantId: string) => {
  const response = await axios.get('/api/grant-application/is-user-eligible', {
    params: { grantId },
  });
  return response.data;
};

export const userApplicationStatusQuery = (id: string) =>
  queryOptions({
    queryKey: ['userApplication', id],
    queryFn: () => fetchUserApplicationStatus(id),
  });
