import { queryOptions } from '@tanstack/react-query';

import { api } from '@/lib/api';

import { type UserApplicationResponse } from '../constants/userApplication';

export type GrantApplicationWithTranchesAndUser = UserApplicationResponse;

const fetchUserApplication = async (grantId: string) => {
  const response = await api.get<GrantApplicationWithTranchesAndUser>(
    '/api/grant-application/get',
    { params: { id: grantId } },
  );
  return response.data;
};

export const userApplicationQuery = (id: string) =>
  queryOptions({
    queryKey: ['userApplication', id],
    queryFn: () => fetchUserApplication(id),
    retry: false,
  });
