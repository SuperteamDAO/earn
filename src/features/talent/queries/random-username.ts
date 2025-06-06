import { queryOptions } from '@tanstack/react-query';

import { api } from '@/lib/api';

interface UsernameRandomType {
  available: boolean;
  username?: string;
  error?: string;
}

const fetchUsernameRandom = async (
  name?: string,
): Promise<UsernameRandomType> => {
  const params = name ? { name } : {};
  const { data } = await api.get<UsernameRandomType>(
    '/api/user/random-username',
    { params },
  );
  return data;
};

export const usernameRandomQuery = (name?: string) =>
  queryOptions({
    queryKey: ['usernameRandom', name],
    queryFn: () => fetchUsernameRandom(name),
  });
