import { type GrantApplication, type GrantTranche } from '@prisma/client';
import { queryOptions } from '@tanstack/react-query';

import { api } from '@/lib/api';

export interface GrantApplicationWithTranches extends GrantApplication {
  GrantTranche: GrantTranche[];
}

const fetchUserApplication = async (grantId: string) => {
  const response = await api.get<GrantApplicationWithTranches>(
    '/api/grant-application/get',
    {
      params: { id: grantId },
    },
  );
  return response.data;
};

export const userApplicationQuery = (id: string) =>
  queryOptions({
    queryKey: ['userApplication', id],
    queryFn: () => fetchUserApplication(id),
    retry: false,
  });
