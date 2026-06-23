import { NextResponse } from 'next/server';

export const maxDuration = 300;

export async function POST() {
  /*
   * Legacy endpoint disabled
   * Grant application create/update already queue autoReviewGrantApplication
   * directly. Sponsor dashboard bulk review uses ai/unreviewed and
   * ai/commit-reviewed
   */
  return NextResponse.json(
    {
      error: 'Legacy endpoint disabled',
      message: 'Grant application AI review has updated methods',
    },
    { status: 410 },
  );
}
