import type { PrismaClient } from '@/prisma/client';

type GrantApplicationStatus = 'Pending' | 'Approved' | 'Completed' | 'Rejected';

type SummaryPrismaClient = Pick<PrismaClient, 'grantApplication'>;

const APPROVED_STATUS: GrantApplicationStatus = 'Approved';
const FUNDED_STATUSES: GrantApplicationStatus[] = [
  APPROVED_STATUS,
  'Completed',
];
const REJECTED_STATUS: GrantApplicationStatus = 'Rejected';
const PENDING_STATUS: GrantApplicationStatus = 'Pending';
const TOUCHING_GRASS_SPEND_ALERT_USD = 5000;
const DEFAULT_YTD_START_DATE = new Date(2026, 0, 1);

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
});

const yearFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
});

export interface FortnightlyGrantsSummaryParams {
  startDate: Date;
  endDate: Date;
  now?: Date;
  ytdStartDate?: Date;
}

export interface FortnightlyGrantsSummary {
  subject: string;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  touchingGrassFunds: TouchingGrassFundsSummary;
  agenticEngineeringGrants: AgenticEngineeringGrantsSummary;
  patternFlags: RepeatWalletFlag[];
  chapterScorecard: ChapterScorecardRow[];
}

export interface TouchingGrassFundsSummary {
  totalApplicationsReceived: number;
  totalApprovedApplications: number;
  totalApprovedUsd: number;
  fundedEventBuckets: SummaryBucket[];
  chaptersOverSpendThreshold: ChapterSpendAlert[];
}

export interface AgenticEngineeringGrantsSummary {
  totalApplicationsReceived: number;
  totalApprovedApplications: number;
  totalRejectedApplications: number;
  totalPendingApplications: number;
  totalApprovedUsd: number;
  fundedGrantBuckets: SummaryBucket[];
}

export interface SummaryBucket {
  label: string;
  count: number;
  approvedUsd: number;
}

export interface ChapterSpendAlert {
  chapter: string;
  approvedApplications: number;
  approvedUsd: number;
}

export interface RepeatWalletFlag {
  walletAddress: string;
  userIds: string[];
  applications: {
    id: string;
    userId: string;
    grantTitle: string;
    approvedUsd: number;
    decidedAt: Date | null;
  }[];
}

export interface ChapterScorecardRow {
  chapter: string;
  applicationsReceived: number;
  approvedApplications: number;
  approvedUsd: number;
  ytdApprovedUsd: number;
}

type SummaryApplication = Awaited<
  ReturnType<typeof fetchApplicationsForSummary>
>[number];

export async function buildFortnightlyGrantsSummary(
  db: SummaryPrismaClient,
  params: FortnightlyGrantsSummaryParams,
): Promise<FortnightlyGrantsSummary> {
  const periodApplications = await fetchApplicationsForSummary(db, {
    createdAt: { gte: params.startDate, lte: params.endDate },
  });

  const periodDecidedApplications = await fetchApplicationsForSummary(db, {
    decidedAt: { gte: params.startDate, lte: params.endDate },
  });

  const ytdApplications = await fetchApplicationsForSummary(db, {
    decidedAt: {
      gte: params.ytdStartDate ?? DEFAULT_YTD_START_DATE,
      lte: params.now ?? params.endDate,
    },
  });

  const periodFundedApplications =
    periodDecidedApplications.filter(isFundedApplication);
  const periodApprovedApplications = periodDecidedApplications.filter(
    isApprovedApplication,
  );
  const approvedApplicationsForPeriodWallets =
    await fetchApprovedApplicationsForWallets(db, periodApprovedApplications);

  return {
    subject: buildFortnightlyGrantsSummarySubject(
      params.startDate,
      params.endDate,
    ),
    dateRange: {
      startDate: params.startDate,
      endDate: params.endDate,
    },
    touchingGrassFunds: buildTouchingGrassFundsSummary(
      periodApplications,
      periodFundedApplications,
    ),
    agenticEngineeringGrants: buildAgenticEngineeringGrantsSummary(
      periodApplications,
      periodFundedApplications,
    ),
    patternFlags: buildRepeatWalletFlags(
      periodApprovedApplications,
      approvedApplicationsForPeriodWallets,
    ),
    chapterScorecard: buildChapterScorecard(
      periodApplications,
      periodFundedApplications,
      ytdApplications,
    ),
  };
}

export function buildFortnightlyGrantsSummarySubject(
  startDate: Date,
  endDate: Date,
): string {
  return `Fortnightly Grants Summary: ${formatDateRange(startDate, endDate)}`;
}

export function renderFortnightlyGrantsSummaryText(
  summary: FortnightlyGrantsSummary,
): string {
  return [
    `Subject: ${summary.subject}`,
    '',
    'Touching Grass Funds',
    `Applications received: ${summary.touchingGrassFunds.totalApplicationsReceived}`,
    `Approved across all chapters: ${formatUsd(
      summary.touchingGrassFunds.totalApprovedUsd,
    )} across ${summary.touchingGrassFunds.totalApprovedApplications} grant applications`,
    renderBucketLines(
      'Funded event buckets',
      summary.touchingGrassFunds.fundedEventBuckets,
    ),
    renderChapterSpendAlerts(
      summary.touchingGrassFunds.chaptersOverSpendThreshold,
    ),
    '',
    'Agentic Engineering Grants',
    `Applications received: ${summary.agenticEngineeringGrants.totalApplicationsReceived}`,
    `Approved: ${summary.agenticEngineeringGrants.totalApprovedApplications}`,
    `Rejected: ${summary.agenticEngineeringGrants.totalRejectedApplications}`,
    `Pending: ${summary.agenticEngineeringGrants.totalPendingApplications}`,
    `Approved amount: ${formatUsd(
      summary.agenticEngineeringGrants.totalApprovedUsd,
    )}`,
    renderBucketLines(
      'Funded grant buckets',
      summary.agenticEngineeringGrants.fundedGrantBuckets,
    ),
    '',
    'Pattern Flags',
    renderRepeatWalletFlags(summary.patternFlags),
    '',
    'Chapter Scorecard',
    renderChapterScorecard(summary.chapterScorecard),
  ].join('\n');
}

export function isTouchingGrassGrantTitle(title: string | null): boolean {
  return title?.toLowerCase().includes('touching grass') ?? false;
}

export function isAgenticEngineeringGrantTitle(title: string | null): boolean {
  return title?.toLowerCase().includes('agentic engineering') ?? false;
}

function buildTouchingGrassFundsSummary(
  periodApplications: SummaryApplication[],
  periodFundedApplications: SummaryApplication[],
): TouchingGrassFundsSummary {
  const receivedApplications = periodApplications.filter((application) =>
    isTouchingGrassGrantTitle(application.grant.title),
  );
  const fundedApplications = periodFundedApplications.filter((application) =>
    isTouchingGrassGrantTitle(application.grant.title),
  );

  return {
    totalApplicationsReceived: receivedApplications.length,
    totalApprovedApplications: fundedApplications.length,
    totalApprovedUsd: sumApprovedUsd(fundedApplications),
    fundedEventBuckets: buildBuckets(
      fundedApplications,
      getTouchingGrassEventBucket,
    ),
    chaptersOverSpendThreshold: buildChapterSpendAlerts(
      fundedApplications,
      TOUCHING_GRASS_SPEND_ALERT_USD,
    ),
  };
}

function buildAgenticEngineeringGrantsSummary(
  periodApplications: SummaryApplication[],
  periodFundedApplications: SummaryApplication[],
): AgenticEngineeringGrantsSummary {
  const receivedApplications = periodApplications.filter((application) =>
    isAgenticEngineeringGrantTitle(application.grant.title),
  );
  const fundedApplications = periodFundedApplications.filter((application) =>
    isAgenticEngineeringGrantTitle(application.grant.title),
  );

  return {
    totalApplicationsReceived: receivedApplications.length,
    totalApprovedApplications:
      receivedApplications.filter(isFundedApplication).length,
    totalRejectedApplications: receivedApplications.filter(
      (application) => application.applicationStatus === REJECTED_STATUS,
    ).length,
    totalPendingApplications: receivedApplications.filter(
      (application) => application.applicationStatus === PENDING_STATUS,
    ).length,
    totalApprovedUsd: sumApprovedUsd(fundedApplications),
    fundedGrantBuckets: buildBuckets(
      fundedApplications,
      getAgenticEngineeringGrantBucket,
    ),
  };
}

function buildRepeatWalletFlags(
  periodFundedApplications: SummaryApplication[],
  fundedApplicationsForPeriodWallets: SummaryApplication[],
): RepeatWalletFlag[] {
  const applicationsByWallet = new Map<string, SummaryApplication[]>();
  const periodWallets = new Set(
    periodFundedApplications
      .map((application) => normalizeWalletAddress(application.walletAddress))
      .filter(Boolean),
  );

  for (const application of fundedApplicationsForPeriodWallets) {
    const walletKey = normalizeWalletAddress(application.walletAddress);
    if (!walletKey || !periodWallets.has(walletKey)) continue;

    applicationsByWallet.set(walletKey, [
      ...(applicationsByWallet.get(walletKey) ?? []),
      application,
    ]);
  }

  return [...applicationsByWallet.entries()]
    .map(([walletAddress, applications]) => {
      const userIds = [...new Set(applications.map(({ userId }) => userId))];

      if (userIds.length < 2) {
        return null;
      }

      return {
        walletAddress,
        userIds,
        applications: applications.map((application) => ({
          id: application.id,
          userId: application.userId,
          grantTitle: application.grant.title,
          approvedUsd: getApprovedUsd(application),
          decidedAt: application.decidedAt,
        })),
      };
    })
    .filter((flag): flag is RepeatWalletFlag => flag !== null);
}

function buildChapterScorecard(
  periodApplications: SummaryApplication[],
  periodFundedApplications: SummaryApplication[],
  ytdApplications: SummaryApplication[],
): ChapterScorecardRow[] {
  const rows = new Map<string, ChapterScorecardRow>();

  for (const application of periodApplications) {
    const row = getOrCreateChapterScorecardRow(
      rows,
      getChapterName(application),
    );
    row.applicationsReceived += 1;
  }

  for (const application of periodFundedApplications) {
    const row = getOrCreateChapterScorecardRow(
      rows,
      getChapterName(application),
    );
    row.approvedApplications += 1;
    row.approvedUsd += getApprovedUsd(application);
  }

  for (const application of ytdApplications.filter(isFundedApplication)) {
    const row = getOrCreateChapterScorecardRow(
      rows,
      getChapterName(application),
    );
    row.ytdApprovedUsd += getApprovedUsd(application);
  }

  return [...rows.values()].sort((a, b) => {
    if (b.approvedUsd !== a.approvedUsd) return b.approvedUsd - a.approvedUsd;
    return a.chapter.localeCompare(b.chapter);
  });
}

function buildChapterSpendAlerts(
  applications: SummaryApplication[],
  thresholdUsd: number,
): ChapterSpendAlert[] {
  const chapterRows = new Map<string, ChapterSpendAlert>();

  for (const application of applications) {
    const chapter = getChapterName(application);
    const row = chapterRows.get(chapter) ?? {
      chapter,
      approvedApplications: 0,
      approvedUsd: 0,
    };

    row.approvedApplications += 1;
    row.approvedUsd += getApprovedUsd(application);
    chapterRows.set(chapter, row);
  }

  return [...chapterRows.values()]
    .filter(({ approvedUsd }) => approvedUsd > thresholdUsd)
    .sort((a, b) => b.approvedUsd - a.approvedUsd);
}

function buildBuckets(
  applications: SummaryApplication[],
  getBucket: (application: SummaryApplication) => string,
): SummaryBucket[] {
  const buckets = new Map<string, SummaryBucket>();

  for (const application of applications) {
    const label = getBucket(application);
    const bucket = buckets.get(label) ?? {
      label,
      count: 0,
      approvedUsd: 0,
    };

    bucket.count += 1;
    bucket.approvedUsd += getApprovedUsd(application);
    buckets.set(label, bucket);
  }

  return [...buckets.values()].sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    if (b.approvedUsd !== a.approvedUsd) return b.approvedUsd - a.approvedUsd;
    return a.label.localeCompare(b.label);
  });
}

function getTouchingGrassEventBucket(application: SummaryApplication): string {
  const text = getApplicationSearchText(application);

  if (
    hasAnyKeyword(text, [
      'workshop',
      'bootcamp',
      'builder',
      'developer',
      'education',
      'training',
      'class',
      'cohort',
    ])
  ) {
    return 'Workshops & builder education';
  }

  if (
    hasAnyKeyword(text, [
      'meetup',
      'mixer',
      'community',
      'networking',
      'dinner',
      'brunch',
      'coffee',
      'happy hour',
      'social',
    ])
  ) {
    return 'Meetups & community gatherings';
  }

  if (
    hasAnyKeyword(text, [
      'hackathon',
      'hacker',
      'demo',
      'pitch',
      'showcase',
      'cowork',
      'ship',
      'build day',
    ])
  ) {
    return 'Hackathons, demo days & build sprints';
  }

  return 'Other';
}

function getAgenticEngineeringGrantBucket(
  application: SummaryApplication,
): string {
  const text = getApplicationSearchText(application);

  if (
    hasAnyKeyword(text, [
      'developer',
      'sdk',
      'tool',
      'github',
      'cli',
      'api',
      'automation',
      'workflow',
    ])
  ) {
    return 'Developer tools & workflow agents';
  }

  if (
    hasAnyKeyword(text, [
      'consumer',
      'chat',
      'assistant',
      'telegram',
      'discord',
      'wallet',
      'trading',
      'user',
    ])
  ) {
    return 'User-facing agents';
  }

  if (
    hasAnyKeyword(text, [
      'research',
      'analytics',
      'data',
      'index',
      'monitor',
      'dashboard',
      'insight',
    ])
  ) {
    return 'Research, analytics & data agents';
  }

  return 'Other';
}

function getApplicationSearchText(application: SummaryApplication): string {
  return [
    application.projectTitle,
    application.projectOneLiner,
    application.projectDetails,
    application.proofOfWork,
    application.milestones,
    application.kpi,
    application.expenseBreakdown,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function hasAnyKeyword(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword));
}

function getOrCreateChapterScorecardRow(
  rows: Map<string, ChapterScorecardRow>,
  chapter: string,
): ChapterScorecardRow {
  const existingRow = rows.get(chapter);

  if (existingRow) {
    return existingRow;
  }

  const row = {
    chapter,
    applicationsReceived: 0,
    approvedApplications: 0,
    approvedUsd: 0,
    ytdApprovedUsd: 0,
  };

  rows.set(chapter, row);
  return row;
}

function getChapterName(application: SummaryApplication): string {
  return (
    application.grant.sponsor.chapter?.displayValue ??
    application.grant.sponsor.chapter?.name ??
    application.grant.region ??
    'Unassigned'
  );
}

function isFundedApplication(application: SummaryApplication): boolean {
  return FUNDED_STATUSES.includes(
    application.applicationStatus as GrantApplicationStatus,
  );
}

function isApprovedApplication(application: SummaryApplication): boolean {
  return application.applicationStatus === APPROVED_STATUS;
}

function sumApprovedUsd(applications: SummaryApplication[]): number {
  return applications.reduce(
    (total, application) => total + getApprovedUsd(application),
    0,
  );
}

function getApprovedUsd(application: SummaryApplication): number {
  return application.approvedAmountInUSD || application.approvedAmount || 0;
}

function normalizeWalletAddress(walletAddress: string | null): string {
  return walletAddress?.trim().toLowerCase() ?? '';
}

function formatDateRange(startDate: Date, endDate: Date): string {
  const startYear = yearFormatter.format(startDate);
  const endYear = yearFormatter.format(endDate);

  if (startYear === endYear) {
    return `${dateFormatter.format(startDate)}–${dateFormatter.format(
      endDate,
    )}, ${endYear}`;
  }

  return `${dateFormatter.format(startDate)}, ${startYear}–${dateFormatter.format(
    endDate,
  )}, ${endYear}`;
}

function renderBucketLines(title: string, buckets: SummaryBucket[]): string {
  if (buckets.length === 0) {
    return `${title}: none`;
  }

  return [
    `${title}:`,
    ...buckets.map(
      (bucket) =>
        `- ${bucket.label}: ${bucket.count} applications, ${formatUsd(
          bucket.approvedUsd,
        )}`,
    ),
  ].join('\n');
}

function renderChapterSpendAlerts(alerts: ChapterSpendAlert[]): string {
  if (alerts.length === 0) {
    return 'Chapters over $5,000 in approved fortnight spend: none';
  }

  return [
    'Chapters over $5,000 in approved fortnight spend:',
    ...alerts.map(
      (alert) =>
        `- ${alert.chapter}: ${formatUsd(alert.approvedUsd)} across ${
          alert.approvedApplications
        } applications`,
    ),
  ].join('\n');
}

function renderRepeatWalletFlags(flags: RepeatWalletFlag[]): string {
  if (flags.length === 0) {
    return 'No approved grants share a wallet across different applicant ids.';
  }

  return flags
    .map(
      (flag) =>
        `- ${flag.walletAddress}: ${flag.userIds.length} applicant ids, ${
          flag.applications.length
        } approved grants`,
    )
    .join('\n');
}

function renderChapterScorecard(rows: ChapterScorecardRow[]): string {
  if (rows.length === 0) {
    return 'No chapter activity for this period.';
  }

  return [
    'Chapter | Received | Approved | Approved $ | YTD Approved $',
    ...rows.map(
      (row) =>
        `${row.chapter} | ${row.applicationsReceived} | ${
          row.approvedApplications
        } | ${formatUsd(row.approvedUsd)} | ${formatUsd(row.ytdApprovedUsd)}`,
    ),
  ].join('\n');
}

function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

async function fetchApprovedApplicationsForWallets(
  db: SummaryPrismaClient,
  periodApprovedApplications: SummaryApplication[],
): Promise<SummaryApplication[]> {
  const walletAddresses = [
    ...new Set(
      periodApprovedApplications
        .map((application) => application.walletAddress?.trim())
        .filter((walletAddress): walletAddress is string => !!walletAddress),
    ),
  ];

  if (walletAddresses.length === 0) {
    return [];
  }

  return await fetchApplicationsForSummary(db, {
    applicationStatus: APPROVED_STATUS,
    walletAddress: { in: walletAddresses },
  });
}

async function fetchApplicationsForSummary(
  db: SummaryPrismaClient,
  where: NonNullable<
    Parameters<SummaryPrismaClient['grantApplication']['findMany']>[0]
  >['where'],
) {
  return await db.grantApplication.findMany({
    where,
    select: {
      id: true,
      userId: true,
      grantId: true,
      applicationStatus: true,
      projectTitle: true,
      projectOneLiner: true,
      projectDetails: true,
      proofOfWork: true,
      milestones: true,
      kpi: true,
      walletAddress: true,
      ask: true,
      approvedAmount: true,
      approvedAmountInUSD: true,
      decidedAt: true,
      createdAt: true,
      expenseBreakdown: true,
      grant: {
        select: {
          title: true,
          region: true,
          sponsor: {
            select: {
              name: true,
              chapter: {
                select: {
                  name: true,
                  displayValue: true,
                  region: true,
                },
              },
            },
          },
        },
      },
    },
  });
}
