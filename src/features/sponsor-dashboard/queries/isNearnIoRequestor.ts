import { queryOptions } from '@tanstack/react-query';

import { isNearnIoRequestor } from '@/utils/near';

const fetchIsNearnIoRequestor = async (dao: string): Promise<boolean> => {
  const result = await isNearnIoRequestor(dao);
  return result ?? false;
};

export const isNearnIoRequestorQuery = (dao: string | undefined) =>
  queryOptions({
    queryKey: ['isNearnIoRequestor', dao],
    queryFn: () => fetchIsNearnIoRequestor(dao!),
    enabled: !!dao,
    staleTime: 1000 * 60 * 15,
    gcTime: 1000 * 60 * 20,
  });
