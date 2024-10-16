import { queryOptions } from '@tanstack/react-query';
import axios from 'axios';

interface UsernameRandomType {
  available: boolean;
  username?: string;
  error?: string;
}

const fetchUsernameRandom = async (
  firstName?: string,
): Promise<UsernameRandomType> => {
  const params = firstName ? { firstName } : {};
  const { data } = await axios.get<UsernameRandomType>(
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
