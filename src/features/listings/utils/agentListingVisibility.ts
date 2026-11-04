import { type BountiesWhereInput } from '@/prisma/models/Bounties';

/** Listing-level conditions shared by agent discovery and details. */
export const agentListingVisibilityWhere = {
  isPublished: true,
  isActive: true,
  isPrivate: false,
  isArchived: false,
  agentAccess: { in: ['AGENT_ALLOWED', 'AGENT_ONLY'] },
  sponsor: { isVerified: true },
} satisfies BountiesWhereInput;
