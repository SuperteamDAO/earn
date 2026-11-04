import { queryOptions } from '@tanstack/react-query';

import { api } from '@/lib/api';

const fetchRegionEligibility = async (grantId: string) => {
  const response = await api.get<{ isEligible: boolean }>(
    '/api/grant-application/region-eligibility',
    { params: { grantId } },
  );
  return response.data;
};

export const regionEligibilityQuery = (grantId: string) =>
  queryOptions({
    queryKey: ['regionEligibility', grantId],
    queryFn: () => fetchRegionEligibility(grantId),
  });
