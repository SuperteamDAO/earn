import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { z, ZodError } from 'zod';

import earncognitoClient from '@/lib/earncognitoClient';
import { reportListingRateLimiter } from '@/lib/ratelimit';
import { checkAndApplyRateLimitApp } from '@/lib/rateLimiterService';
import { prisma } from '@/prisma';

import { getUserSession } from '@/features/auth/utils/getUserSession';

const reportListingSchema = z.object({
  listingTitle: z.string().min(1, 'Listing title is required'),
  listingUrl: z.string().url('A valid listing URL is required'),
  reasonTitle: z.string().min(1, 'Reason for reporting is required'),
  userEmail: z.string().email('A valid user email is required').optional(),
  reasonSubtext: z.string().optional(),
});

export type ReportListingPayload = z.infer<typeof reportListingSchema>;

export async function POST(request: NextRequest) {
  try {
    const session = await getUserSession(await headers());
    if (session.error || !session.data) {
      return NextResponse.json(
        { error: session.error || 'Unauthorized' },
        { status: session.status || 401 },
      );
    }

    const { userId } = session.data;

    const rateLimitResponse = await checkAndApplyRateLimitApp({
      limiter: reportListingRateLimiter,
      identifier: userId,
      routeName: 'reportListing',
    });
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (!user?.email) {
      return NextResponse.json(
        { error: 'Authenticated user email is required to report listings' },
        { status: 400 },
      );
    }

    const body = await request.json();
    const payload = {
      ...reportListingSchema.parse(body),
      userEmail: user.email,
    };
    const botResponse = await earncognitoClient.post(
      '/telegram/report-listing',
      payload,
      { validateStatus: () => true },
    );
    if (botResponse.status >= 400) {
      return NextResponse.json(
        { error: botResponse.data?.error ?? 'Upstream error' },
        { status: botResponse.status },
      );
    }
    return NextResponse.json({
      ok: true,
      message: 'Report notification sent successfully.',
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid payload', details: error.errors },
        { status: 400 },
      );
    }
    console.error(error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
