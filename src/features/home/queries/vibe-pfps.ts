import { queryOptions } from '@tanstack/react-query';
import axios from 'axios';

const fetchPfps = async (userIds: string[]) => {
  const maxPfps = 6;
  const latestUserIds = userIds.slice(-maxPfps);
  const responses = await Promise.all(
    latestUserIds.map((id) =>
      axios.post('/api/user/pfps', { id }).then((res) => res.data),
    ),
  );
  return responses;
};

export const pfpsQuery = (userIds: string[]) =>
  queryOptions({
    queryKey: ['vibers-pfps', userIds],
    queryFn: () => fetchPfps(userIds),
    enabled: userIds.length > 0,
  });
