import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { type EnumBountyTypeFilter } from '@/prisma/commonInputTypes';
import { type BountyType } from '@/prisma/enums';
import { type BountiesFindManyArgs } from '@/prisma/models/Bounties';

import { type NextApiRequestWithAgent } from '@/features/auth/types';
import { withAgentAuth } from '@/features/auth/utils/withAgentAuth';
import { listingSelect } from '@/features/listings/constants/schema';

async function handler(req: NextApiRequestWithAgent, res: NextApiResponse) {
  const params = req.query;

  const type = params.type as EnumBountyTypeFilter | BountyType | undefined;
  const take = params.take ? parseInt(params.take as string, 10) : 10;
  const deadline = params.deadline as string;
  const exclusiveSponsorId = params.exclusiveSponsorId as string | undefined;
  let excludeIds = params['excludeIds[]'];
  if (typeof excludeIds === 'string') {
    excludeIds = [excludeIds];
  }

  const listingQueryOptions: BountiesFindManyArgs = {
    where: {
      id: {
        notIn: excludeIds,
      },
      isPublished: true,
      isActive: true,
      isPrivate: false,
      isArchived: false,
      status: 'OPEN',
      deadline: { gte: deadline },
      type: type || { in: ['bounty', 'project'] },
      agentAccess: { in: ['AGENT_ALLOWED', 'AGENT_ONLY'] },
      sponsorId: exclusiveSponsorId,
    },
    select: listingSelect,
    take,
    orderBy: [{ deadline: 'asc' }, { winnersAnnouncedAt: 'desc' }],
  };

  try {
    const listings = await prisma.bounties.findMany(listingQueryOptions);
    res.status(200).json(listings);
  } catch (error) {
    logger.error(error);

    res.status(400).json({
      error,
      message: 'Error occurred while fetching listings',
    });
  }
}

export default withAgentAuth(handler);
