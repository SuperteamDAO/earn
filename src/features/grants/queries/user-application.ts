import { queryOptions } from '@tanstack/react-query';

import {
  type GrantApplicationModel,
  type GrantTrancheModel,
  type UserModel,
} from '@/interface/prisma/models';
import { api } from '@/lib/api';

export interface GrantApplicationWithTranchesAndUser
  extends GrantApplicationModel {
  GrantTranche: GrantTrancheModel[];
  user: UserModel;
}

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
