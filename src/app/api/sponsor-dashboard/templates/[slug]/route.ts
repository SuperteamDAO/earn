import { NextResponse } from 'next/server';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { dayjs } from '@/utils/dayjs';
import { safeStringify } from '@/utils/safeStringify';

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
      include: {
        poc: true,
        sponsor: true,
      },
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
        error: error.message,
        message: `Error occurred while fetching bounty template with slug=${slug}.`,
      },
      { status: 400 },
    );
  }
}
