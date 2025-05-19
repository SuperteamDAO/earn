import { queryOptions } from '@tanstack/react-query';

import { api } from '@/lib/api';

import { type GrantApplicationWithUser } from '../types';

const fetchApprovedGrantees = async (
  grantId: string,
  searchTerm: string,
): Promise<GrantApplicationWithUser[]> => {
  const response = await api.get(
    '/api/sponsor-dashboard/grants/approved-grantees',
    {
      params: { grantId, search: searchTerm },
    },
  );
  return response.data;
};

export const approvedGranteesQuery = (
  grantId: string | undefined,
  currentSponsorId: string | undefined,
  searchTerm: string = '',
) =>
  queryOptions({
    queryKey: ['approved-grantees', grantId, searchTerm],
    queryFn: () => fetchApprovedGrantees(grantId!, searchTerm),
    enabled: !!currentSponsorId && !!grantId,
  });
