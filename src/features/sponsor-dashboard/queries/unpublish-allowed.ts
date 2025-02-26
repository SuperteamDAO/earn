import { queryOptions } from '@tanstack/react-query';

import { api } from '@/lib/api';
type UnpublishAllowedResponse = {
  data?: {
    allowed: boolean;
  };
};

const fetchUnpublishAllowed = async (id: string): Promise<boolean> => {
  const { data } = await api.get<UnpublishAllowedResponse>(
    `/api/sponsor-dashboard/listing/${id}/is-unpublish-allowed`,
    {},
  );
  return !!data.data?.allowed;
};

export const unpublishAllowedQuery = (id: string) =>
  queryOptions({
    queryKey: ['is-unpublish-allowed', id],
    queryFn: () => fetchUnpublishAllowed(id),
    enabled: !!id,
  });
