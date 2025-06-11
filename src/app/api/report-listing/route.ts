import { type NextRequest, NextResponse } from 'next/server';
import { z, ZodError } from 'zod';

import earncognitoClient from '@/lib/earncognitoClient';

const reportListingSchema = z.object({
  listingTitle: z.string().min(1, 'Listing title is required'),
  listingUrl: z.string().url('A valid listing URL is required'),
  reasonTitle: z.string().min(1, 'Reason for reporting is required'),
  userEmail: z.string().email('A valid user email is required'),
  reasonSubtext: z.string().optional(),
});

export type ReportListingPayload = z.infer<typeof reportListingSchema>;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = reportListingSchema.parse(body);
    const botResponse = await earncognitoClient.post(
      '/telegram/report-listing',
      payload,
    );
    if (botResponse.status >= 400) {
      return NextResponse.json(
        { error: botResponse.data.error },
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
