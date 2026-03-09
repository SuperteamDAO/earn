import { queryOptions } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { type GrantApplicationModel } from '@/prisma/models/GrantApplication';
import { type GrantTrancheModel } from '@/prisma/models/GrantTranche';

interface GrantApplicationUserKycState {
  isKYCVerified: boolean;
  kycCountry: string | null;
  kycVerifiedAt: Date | null;
}

export interface GrantApplicationWithTranchesAndUser
  extends GrantApplicationModel {
  GrantTranche: GrantTrancheModel[];
  user: GrantApplicationUserKycState;
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
