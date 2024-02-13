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
  rewardAmount?: number;
  link?: string;
  source?: string;
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
}

export type { Grant };
