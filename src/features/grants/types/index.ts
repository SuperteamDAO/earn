import type { Skills } from '@/interface/skills';
import type { User } from '@/interface/user';

import { type References } from '@/features/listings/types';

interface Grant {
  id: string;
  title: string;
  slug: string;
  logo?: string;
  description?: string;
  shortDescription?: string;
  skills?: Skills;
  token?: string;
  link?: string;
  sponsorId?: string;
  sponsor?: {
    name: string;
    logo: string;
    isVerified: boolean;
    entityName: string;
  };
  pocId?: string;
  poc?: User;
  isPublished?: boolean;
  isFeatured?: boolean;
  isActive?: boolean;
  isArchived?: boolean;
  createdAt?: string;
  updatedAt?: string;
  minReward?: number;
  maxReward?: number;
  questions?: any;
  pocSocials?: string;
  status: string;
  region: string;
  references: References[];
  requirements?: string;
  applicationStatus?: 'Pending' | 'Approved' | 'Rejected' | 'Completed';
  totalPaid: number;
  totalApproved: number;
  historicalApplications: number;
  avgResponseTime?: string;
  airtableId?: string;
  isNative?: boolean;
  ai?: GrantsAi;
}

interface GrantWithApplicationCount extends Grant {
  totalApplications: number;
}

import { type SubmissionLabels } from '@prisma/client';

export interface GrantsAiContxt {
  totalInputTokens: number;
  totalOutputTokens: number;
  domainSummary: string[];
  shortlistCriterias: string[];
  totalTimeinMs: number;
  totalCostInUSD: number;
}

export interface GrantsAi {
  context?: GrantsAiContxt;
}

export type EvaluationResult = {
  predictedLabel: SubmissionLabels;
  reasoning: string;
  totalCostInUSD: number;
  totalTimeinMs: number;
  shortNote: string;
};

export interface GrantApplicationAi {
  review?: EvaluationResult;
  commited?: boolean;
}

export type { Grant, GrantWithApplicationCount };
