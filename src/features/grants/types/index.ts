import type { Skills } from '@/interface/skills';
import type { User } from '@/interface/user';

import { type References } from '@/features/listings/types';

export type GrantQuestion = {
  order: number;
  question: string;
  optional?: boolean;
  type?: 'text' | 'link';
};

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
    id?: string;
    name: string;
    logo: string;
    slug: string;
    isVerified: boolean;
    entityName?: string;
    chapter?: {
      id: string;
    } | null;
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
  questions?: GrantQuestion[];
  pocSocials?: string;
  status: string;
  region: string;
  references: References[];
  requirements?: string;
  applicationStatus?: 'Pending' | 'Approved' | 'Rejected' | 'Completed';
  approvedAmountTotal: number;
  historicalApplications: number;
  avgResponseTime?: string;
  airtableId?: string;
  isNative?: boolean;
  ai?: GrantsAi;
  isPro?: boolean;
  isST?: boolean;
}

interface GrantWithApplicationCount extends Grant {
  totalApplications: number;
}

import { type SubmissionLabels } from '@/prisma/enums';

interface GrantsAiContxt {
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

type EvaluationResult = {
  predictedLabel: SubmissionLabels;
  recommendation?: 'Accept' | 'Reject' | 'Needs_Review';
  confidence?: 'low' | 'medium' | 'high';
  reasoning: string;
  decisionReason?: string;
  risks?: string[];
  colosseum?: {
    enabled: boolean;
    summary: string;
    error?: string;
  };
  solanaTechnical?: {
    isSolanaTechnical: boolean;
    capabilityAreas: string[];
    technicalCoherence: 'low' | 'medium' | 'high' | 'not_applicable';
    missingImplementationDetails: string[];
    reviewerRisks: string[];
    summary: string;
  };
  totalCostInUSD: number;
  totalTimeinMs: number;
  shortNote: string;
  scores?: {
    pow: number;
    activity: number;
    core: number;
    feasibility: number;
    impact: number;
  };
};

export interface GrantApplicationAi {
  review?: EvaluationResult;
  commited?: boolean;
}

export type { Grant, GrantWithApplicationCount };
