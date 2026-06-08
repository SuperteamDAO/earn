import { type NextRequest, NextResponse } from 'next/server';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { GrantApplicationStatus } from '@/prisma/enums';
import { dayjs } from '@/utils/dayjs';
import { safeStringify } from '@/utils/safeStringify';

import { resend } from '@/features/emails/utils/resend';

const SPONSOR_ID = 'e6646fa9-8584-4d57-8d35-c5754b531718';
const TIMEZONE = 'Asia/Kolkata';
const RECIPIENT =
  process.env.SUPERTEAM_NIGERIA_SUMMARY_TO_EMAIL ||
  'pratik.dholani1@gmail.com';
const FROM_EMAIL =
  process.env.SUPERTEAM_NIGERIA_SUMMARY_FROM_EMAIL ||
  process.env.PRATIK_EMAIL;
const APPROVED_GRANT_STATUSES: GrantApplicationStatus[] = [
  GrantApplicationStatus.Approved,
  GrantApplicationStatus.Completed,
];

type PeriodKey = 'last7Days' | 'last30Days' | 'ytd';

type Period = {
  key: PeriodKey;
  label: string;
  start: Date;
  end: Date;
};

type PeriodMetrics = {
  listingsPublishedCount: number;
  listingsPublishedValue: number;
  grantApplicationsApprovedCount: number;
  grantApplicationsApprovedValue: number;
};

type SummaryMetrics = Record<PeriodKey, PeriodMetrics>;

function getPeriods(now = dayjs().tz(TIMEZONE)): Period[] {
  const end = now.toDate();

  return [
    {
      key: 'last7Days',
      label: 'Last 7 Days',
      start: now.subtract(7, 'day').toDate(),
      end,
    },
    {
      key: 'last30Days',
      label: 'Last 30 Days',
      start: now.subtract(30, 'day').toDate(),
      end,
    },
    {
      key: 'ytd',
      label: 'YTD',
      start: now.startOf('year').toDate(),
      end,
    },
  ];
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCount(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function getPeriodMetrics(period: Period): Promise<PeriodMetrics> {
  const dateFilter = {
    gte: period.start,
    lte: period.end,
  };

  const listingWhere = {
    sponsorId: SPONSOR_ID,
    isPublished: true,
    isFndnPaying: true,
    publishedAt: dateFilter,
  };

  const grantApplicationWhere = {
    grant: {
      sponsorId: SPONSOR_ID,
    },
    applicationStatus: {
      in: APPROVED_GRANT_STATUSES,
    },
    decidedAt: dateFilter,
  };

  const [
    listingsPublishedCount,
    listingsPublishedValue,
    grantApplicationsApprovedCount,
    grantApplicationsApprovedValue,
  ] = await Promise.all([
    prisma.bounties.count({
      where: listingWhere,
    }),
    prisma.bounties.aggregate({
      _sum: { usdValue: true },
      where: listingWhere,
    }),
    prisma.grantApplication.count({
      where: grantApplicationWhere,
    }),
    prisma.grantApplication.aggregate({
      _sum: { approvedAmountInUSD: true },
      where: grantApplicationWhere,
    }),
  ]);

  return {
    listingsPublishedCount,
    listingsPublishedValue: listingsPublishedValue._sum.usdValue || 0,
    grantApplicationsApprovedCount,
    grantApplicationsApprovedValue:
      grantApplicationsApprovedValue._sum?.approvedAmountInUSD || 0,
  };
}

async function getSummaryMetrics(periods: Period[]): Promise<SummaryMetrics> {
  const metrics = await Promise.all(
    periods.map(async (period) => ({
      key: period.key,
      metrics: await getPeriodMetrics(period),
    })),
  );

  return metrics.reduce((acc, item) => {
    acc[item.key] = item.metrics;
    return acc;
  }, {} as SummaryMetrics);
}

function metricCell(value: string): string {
  return `<td style="padding:12px 14px;border-top:1px solid #e5e7eb;text-align:right;font-size:14px;color:#111827;white-space:nowrap;">${value}</td>`;
}

function metricRow(
  label: string,
  periods: Period[],
  values: Record<PeriodKey, string>,
): string {
  return `
    <tr>
      <th scope="row" style="padding:12px 14px;border-top:1px solid #e5e7eb;text-align:left;font-size:14px;font-weight:600;color:#111827;">
        ${escapeHtml(label)}
      </th>
      ${periods.map((period) => metricCell(values[period.key])).join('')}
    </tr>
  `;
}

function buildEmailHtml({
  metrics,
  periods,
  now,
}: {
  metrics: SummaryMetrics;
  periods: Period[];
  now: dayjs.Dayjs;
}): string {
  const rows = [
    metricRow('Listings published with isFndnPaying = 1', periods, {
      last7Days: formatCount(metrics.last7Days.listingsPublishedCount),
      last30Days: formatCount(metrics.last30Days.listingsPublishedCount),
      ytd: formatCount(metrics.ytd.listingsPublishedCount),
    }),
    metricRow('$ value of listings published with isFndnPaying = 1', periods, {
      last7Days: formatUsd(metrics.last7Days.listingsPublishedValue),
      last30Days: formatUsd(metrics.last30Days.listingsPublishedValue),
      ytd: formatUsd(metrics.ytd.listingsPublishedValue),
    }),
    metricRow('Grant applications approved', periods, {
      last7Days: formatCount(metrics.last7Days.grantApplicationsApprovedCount),
      last30Days: formatCount(metrics.last30Days.grantApplicationsApprovedCount),
      ytd: formatCount(metrics.ytd.grantApplicationsApprovedCount),
    }),
    metricRow('$ value of grant applications approved', periods, {
      last7Days: formatUsd(metrics.last7Days.grantApplicationsApprovedValue),
      last30Days: formatUsd(metrics.last30Days.grantApplicationsApprovedValue),
      ytd: formatUsd(metrics.ytd.grantApplicationsApprovedValue),
    }),
  ].join('');

  return `
    <div style="margin:0;padding:24px;background:#f8fafc;font-family:Inter,Arial,sans-serif;color:#111827;">
      <div style="max-width:760px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
        <div style="padding:24px 24px 18px;">
          <p style="margin:0 0 6px;font-size:13px;color:#64748b;">Superteam Nigeria</p>
          <h1 style="margin:0;font-size:22px;line-height:1.25;color:#111827;">Weekly Earn Summary</h1>
          <p style="margin:10px 0 0;font-size:14px;line-height:1.6;color:#475569;">
            Metrics as of ${escapeHtml(now.format('MMMM D, YYYY, h:mm A z'))}. Filtered by sponsor id <code>${SPONSOR_ID}</code>. Listings use <code>publishedAt</code>; grants use <code>decidedAt</code>.
          </p>
        </div>

        <div style="padding:0 24px 24px;overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
            <thead>
              <tr style="background:#f1f5f9;">
                <th style="padding:12px 14px;text-align:left;font-size:12px;letter-spacing:0.04em;text-transform:uppercase;color:#475569;">Metric</th>
                ${periods
                  .map(
                    (period) =>
                      `<th style="padding:12px 14px;text-align:right;font-size:12px;letter-spacing:0.04em;text-transform:uppercase;color:#475569;white-space:nowrap;">${escapeHtml(period.label)}</th>`,
                  )
                  .join('')}
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function isAuthorized(request: NextRequest): boolean {
  if (!process.env.CRON_SECRET) {
    return true;
  }

  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

async function handler(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!FROM_EMAIL) {
    return NextResponse.json(
      {
        error:
          'SUPERTEAM_NIGERIA_SUMMARY_FROM_EMAIL or PRATIK_EMAIL must be configured',
      },
      { status: 500 },
    );
  }

  try {
    const now = dayjs().tz(TIMEZONE);
    const periods = getPeriods(now);
    const metrics = await getSummaryMetrics(periods);
    const subject = `Superteam Nigeria weekly summary - ${now.format('MMM D, YYYY')}`;

    const { data, error } = await resend.emails.send({
      from: `Superteam Earn <${FROM_EMAIL}>`,
      to: [RECIPIENT],
      subject,
      html: buildEmailHtml({ metrics, periods, now }),
    });

    if (error) {
      logger.error('Failed to send Superteam Nigeria weekly summary email', {
        error,
      });
      return NextResponse.json(
        { error: 'Failed to send summary email' },
        { status: 500 },
      );
    }

    logger.info('Sent Superteam Nigeria weekly summary email', {
      messageId: data?.id,
      recipient: RECIPIENT,
      metrics,
    });

    return NextResponse.json({
      success: true,
      messageId: data?.id,
      recipient: RECIPIENT,
      metrics,
    });
  } catch (error) {
    logger.error('Error sending Superteam Nigeria weekly summary email', {
      error: safeStringify(error),
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  return handler(request);
}

export async function POST(request: NextRequest) {
  return handler(request);
}
