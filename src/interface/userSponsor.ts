import type { SponsorType } from '@/interface/sponsor';
import type { User } from '@/interface/user';
import type { Role } from '@/prisma/enums';

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
