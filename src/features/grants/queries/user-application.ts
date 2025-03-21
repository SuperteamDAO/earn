import {
  type GrantApplication,
  type GrantTranche,
  type User,
} from '@prisma/client';
import { queryOptions } from '@tanstack/react-query';

import { api } from '@/lib/api';

export interface GrantApplicationWithTranchesAndUser extends GrantApplication {
  GrantTranche: GrantTranche[];
  user: User;
}

const fetchUserApplication = async (grantId: string) => {
  const response = await api.get<GrantApplicationWithTranchesAndUser>(
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
