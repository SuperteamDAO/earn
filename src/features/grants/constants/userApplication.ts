import {
  type GrantApplicationGetPayload,
  type GrantApplicationSelect,
} from '@/prisma/models/GrantApplication';
import { type JsonResponse } from '@/utils/jsonResponse';

export const userApplicationSelect = {
  id: true,
  applicationStatus: true,
  projectTitle: true,
  projectOneLiner: true,
  projectDetails: true,
  projectTimeline: true,
  proofOfWork: true,
  walletAddress: true,
  twitter: true,
  github: true,
  milestones: true,
  kpi: true,
  answers: true,
  ask: true,
  approvedAmount: true,
  decidedAt: true,
  isCooldownSkipped: true,
  totalTranches: true,
  lumaLink: true,
  expenseBreakdown: true,
  GrantTranche: {
    orderBy: { createdAt: 'asc' as const },
    select: {
      status: true,
      trancheNumber: true,
      ask: true,
      approvedAmount: true,
      decidedAt: true,
      walletAddress: true,
    },
  },
  user: {
    select: {
      isKYCVerified: true,
      kycVerifiedAt: true,
    },
  },
} satisfies GrantApplicationSelect;

export type UserApplicationResponse = JsonResponse<
  GrantApplicationGetPayload<{ select: typeof userApplicationSelect }>
>;
