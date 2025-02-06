import { type NextRequest, NextResponse } from 'next/server';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';

import { type GrantApplicationAi } from '@/features/grants/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id || typeof id !== 'string') {
    return NextResponse.json(
      {
        error: 'Invalid ID provided',
        message: `Invalid ID provided for retrieving unreviewed grant application grant for grant with ${id}.`,
      },
      { status: 400 },
    );
  }
  try {
    const unreviewedApplications = await prisma.grantApplication.findMany({
      where: {
        grantId: id,
        applicationStatus: 'Pending',
        label: 'Unreviewed',
      },
      select: {
        id: true,
        label: true,
        ai: true,
        applicationStatus: true,
      },
    });
    const notReviewedByAI = unreviewedApplications.filter(
      (u) => !(u.ai as unknown as GrantApplicationAi)?.commited,
    );
    return NextResponse.json(notReviewedByAI, { status: 200 });
  } catch (error: any) {
    logger.error(
      `Error occurred while retrieving unreviewed grant applications`,
      {
        id,
      },
    );
    return NextResponse.json(
      {
        error: error.message,
        message: `Error occurred while retrieving unreviewed grant applications`,
      },
      { status: 500 },
    );
  }
}
