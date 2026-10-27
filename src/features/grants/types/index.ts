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
  logo?: string | null;
  description?: string | null;
  shortDescription?: string | null;
  skills?: Skills;
  token?: string | null;
  link?: string | null;
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
  isPaused?: boolean;
  createdAt?: string;
  updatedAt?: string;
  minReward?: number | null;
  maxReward?: number | null;
  questions?: GrantQuestion[];
  pocSocials?: string | null;
  status: GrantStatus;
  region: string;
  references: References[];
  applicationStatus?: GrantApplicationStatus;
  approvedAmountTotal: number;
  historicalApplications: number;
  avgResponseTime?: string | null;
  airtableId?: string | null;
  emailSalutation?: string | null;
  isNative?: boolean;
  ai?: GrantsAi;
  isPro?: boolean;
  isST?: boolean;
}

interface GrantWithApplicationCount extends Grant {
  totalApplications: number;
}

import {
  type SubmissionLabels,
  type GrantApplicationStatus,
  type GrantStatus,
} from '@/prisma/enums';

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
