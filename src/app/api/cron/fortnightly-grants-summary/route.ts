import { type NextRequest, NextResponse } from 'next/server';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { pratikEmail, replyToEmail } from '@/features/emails/utils/fromEmails';
import { resend } from '@/features/emails/utils/resend';
import {
  buildFortnightlyGrantsSummary,
  renderFortnightlyGrantsSummaryText,
} from '@/features/grants/utils/fortnightlyGrantsSummary';

const DEFAULT_RECIPIENT = 'pratik.dholani1@gmail.com';
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const FORTNIGHT_IN_DAYS = 14;

export async function GET(request: NextRequest) {
  return sendFortnightlyGrantsSummary(request);
}

export async function POST(request: NextRequest) {
  return sendFortnightlyGrantsSummary(request);
}

async function sendFortnightlyGrantsSummary(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const recipient =
    searchParams.get('to') ||
    process.env.GRANTS_SUMMARY_EMAIL_TO ||
    DEFAULT_RECIPIENT;
  const isTest = searchParams.get('test') === 'true';

  try {
    const dateRange = getDateRange(searchParams);
    const summary = await buildFortnightlyGrantsSummary(prisma, {
      ...dateRange,
      now: new Date(),
    });
    const text = renderFortnightlyGrantsSummaryText(summary);
    const subject = isTest ? `[Test] ${summary.subject}` : summary.subject;

    await resend.emails.send({
      from: pratikEmail,
      to: [recipient],
      subject,
      text,
      replyTo: replyToEmail,
    });

    logger.info('Fortnightly grants summary email sent', {
      recipient,
      subject,
      startDate: dateRange.startDate.toISOString(),
      endDate: dateRange.endDate.toISOString(),
      isTest,
    });

    return NextResponse.json({
      message: 'Fortnightly grants summary email sent',
      recipient,
      subject,
      startDate: dateRange.startDate.toISOString(),
      endDate: dateRange.endDate.toISOString(),
      isTest,
    });
  } catch (error) {
    if (error instanceof DateRangeError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    logger.error(
      `Failed to send fortnightly grants summary email: ${safeStringify(error)}`,
    );

    return NextResponse.json(
      { error: 'Failed to send fortnightly grants summary email' },
      { status: 500 },
    );
  }
}

function isAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;

  if (process.env.NODE_ENV !== 'production' && !cronSecret) {
    return true;
  }

  if (!cronSecret) {
    return false;
  }

  const authHeader = request.headers.get('authorization');
  const querySecret = new URL(request.url).searchParams.get('secret');

  return authHeader === `Bearer ${cronSecret}` || querySecret === cronSecret;
}

function getDateRange(searchParams: URLSearchParams) {
  const explicitStartDate = searchParams.get('startDate');
  const explicitEndDate = searchParams.get('endDate');

  if (explicitStartDate || explicitEndDate) {
    if (!explicitStartDate || !explicitEndDate) {
      throw new DateRangeError(
        'Both startDate and endDate are required when overriding',
      );
    }

    return {
      startDate: parseDateParam(explicitStartDate, 'startDate'),
      endDate: parseDateParam(explicitEndDate, 'endDate'),
    };
  }

  const endDate = startOfUtcDay(new Date(Date.now() - 2 * DAY_IN_MS));
  const startDate = new Date(endDate.getTime() - FORTNIGHT_IN_DAYS * DAY_IN_MS);

  return { startDate, endDate };
}

function parseDateParam(value: string, paramName: string): Date {
  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    throw new DateRangeError(`Invalid ${paramName}`);
  }

  return date;
}

class DateRangeError extends Error {}

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}
