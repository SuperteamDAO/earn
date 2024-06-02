import { type References } from '@/features/listings';
import type { Skills } from '@/interface/skills';
import type { SponsorType } from '@/interface/sponsor';
import type { User } from '@/interface/user';

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
  sponsor?: SponsorType;
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
  requirements: string;
  applicationStatus: 'Pending' | 'Approved' | 'Rejected';
  totalPaid: number;
}

interface GrantStats {
  count: number;
  approvedSoFar: number;
  averageApproved: number;
}

export type { Grant, GrantStats };
