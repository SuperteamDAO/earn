import { NextResponse } from 'next/server';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { type BountiesTemplatesSelect } from '@/prisma/models/BountiesTemplates';
import { dayjs } from '@/utils/dayjs';
import { safeStringify } from '@/utils/safeStringify';

export const publicTemplateDetailsSelect = {
  id: true,
  title: true,
  deadline: true,
  slug: true,
  description: true,
  skills: true,
  type: true,
  requirements: true,
  region: true,
  status: true,
  token: true,
  references: true,
  referredBy: true,
  publishedAt: true,
  compensationType: true,
  maxRewardAsk: true,
  minRewardAsk: true,
  language: true,
  rewardAmount: true,
  rewards: true,
  maxBonusSpots: true,
  usdValue: true,
  sponsorId: true,
  pocId: true,
  pocSocials: true,
  source: true,
  isPublished: true,
  sponsor: {
    select: {
      name: true,
      logo: true,
      slug: true,
      url: true,
      entityName: true,
      isVerified: true,
      isCaution: true,
    },
  },
  poc: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      username: true,
      photo: true,
    },
  },
} satisfies BountiesTemplatesSelect;

export async function GET(
  _: Request,
  props: { params: Promise<{ slug: string }> },
) {
  const { slug } = await props.params;

  logger.debug(`Request for bounty template with slug: ${slug}`);

  try {
    logger.debug(`Fetching bounty template with slug: ${slug}`);
    const result = await prisma.bountiesTemplates.findFirst({
      where: {
        slug,
        isActive: true,
      },
      select: publicTemplateDetailsSelect,
    });

    if (!result) {
      logger.warn(`No bounty template found with slug: ${slug}`);
      return NextResponse.json(
        {
          message: `No bounty template found with slug=${slug}.`,
        },
        { status: 404 },
      );
    }

    result.deadline = dayjs(new Date()).add(6, 'days').toDate();

    logger.info(`Successfully fetched bounty template for slug: ${slug}`);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    logger.error(
      `Error occurred while fetching bounty template with slug=${slug}: ${safeStringify(error)}`,
    );
    return NextResponse.json(
      {
        message: 'Error occurred while fetching bounty template.',
      },
      { status: 500 },
    );
  }
}
