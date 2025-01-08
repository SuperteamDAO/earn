import { queryOptions } from '@tanstack/react-query';

import { api } from '@/lib/api';

interface UsernameRandomType {
  available: boolean;
  username?: string;
  error?: string;
}

const fetchUsernameRandom = async (
  firstName?: string,
): Promise<UsernameRandomType> => {
  const params = firstName ? { firstName } : {};
  const { data } = await api.get<UsernameRandomType>(
    '/api/user/random-username',
    { params },
  );
  return data;
};

export const usernameRandomQuery = (firstName?: string) =>
  queryOptions({
    queryKey: ['usernameRandom', firstName],
    queryFn: () => fetchUsernameRandom(firstName),
  });
