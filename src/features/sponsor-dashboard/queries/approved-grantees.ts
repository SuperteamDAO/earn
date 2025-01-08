import { queryOptions } from '@tanstack/react-query';

import { api } from '@/lib/api';

import { type GrantApplicationWithUser } from '../types';

const fetchApprovedGrantees = async (
  grantId: string,
): Promise<GrantApplicationWithUser[]> => {
  const response = await api.get(
    '/api/sponsor-dashboard/grants/approved-grantees',
    {
      params: { grantId },
    },
  );
  return response.data;
};

export const approvedGranteesQuery = (
  grantId: string | undefined,
  currentSponsorId: string | undefined,
) =>
  queryOptions({
    queryKey: ['approved-grantees', grantId, grantId!],
    queryFn: () => fetchApprovedGrantees(grantId!),
    enabled: !!currentSponsorId && !!grantId,
  });
