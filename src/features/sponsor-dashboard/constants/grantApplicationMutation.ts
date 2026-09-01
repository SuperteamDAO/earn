import {
  type GrantApplicationGetPayload,
  type GrantApplicationSelect,
} from '@/prisma/models/GrantApplication';

export const grantApplicationMutationSelect = {
  id: true,
  applicationStatus: true,
  totalPaid: true,
  totalTranches: true,
  paymentDetails: true,
} satisfies GrantApplicationSelect;

export type GrantApplicationMutationResponse = GrantApplicationGetPayload<{
  select: typeof grantApplicationMutationSelect;
}>;

export interface GrantApplicationStatusMutationResponse {
  success: true;
  applicationIds: string[];
}
