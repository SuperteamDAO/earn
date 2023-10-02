import type { Role } from '@prisma/client';

import type { SponsorType } from '@/interface/sponsor';
import type { User } from '@/interface/user';

interface UserSponsor {
  userId?: string;
  sponsorId?: string;
  role?: Role;
  createdAt?: string;
  updatedAt?: string;
  user?: User;
  sponsor?: SponsorType;
}
export type { UserSponsor };
