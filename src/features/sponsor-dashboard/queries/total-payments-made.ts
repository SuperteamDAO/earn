import { queryOptions } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { getURL } from '@/utils/validUrl';

interface TotalPaymentsMadeResponse {
  totalPaymentsMade: number;
  listingId: number;
}
const fetchTotalPaymentsMade = async (id: string): Promise<number> => {
  const { data } = await api.get<TotalPaymentsMadeResponse>(
    `${getURL()}api/sponsor-dashboard/listing/${id}/total-payments-made`,
  );
  return data.totalPaymentsMade;
};

export const totalPaymentsMadeQuery = (id: string) =>
  queryOptions({
    queryKey: ['total-payments-made', id],
    queryFn: () => fetchTotalPaymentsMade(id),
  });
