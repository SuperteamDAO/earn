import { prisma } from '@/prisma';
import { z } from 'zod';

export const FeedTypeSchema = z.enum(['submission', 'pow', 'grant-application']);
export type FeedType = z.infer<typeof FeedTypeSchema>;

export interface FeedItem {
  readonly id: string;
  readonly type: FeedType;
  readonly sortDate: Date;
  readonly likeCount: number;
}

export interface FeedFilters {
  readonly startDate?: Date | undefined;
  readonly endDate: Date;
  readonly isWinner: boolean;
  readonly filter?: 'popular' | 'new' | undefined;
  readonly profileUserId?: string | null | undefined;
  readonly profileAgentId?: string | null | undefined;
  readonly shouldIncludeAgentSubmissions: boolean;
  readonly takeOnlyType?: string | undefined;
  readonly highlightId?: string | undefined;
  readonly highlightType?: string | undefined;
}

export const FeedCursorSchema = z.object({
  id: z.string().min(1),
  type: FeedTypeSchema,
  sortDate: z.string().min(1),
  likeCount: z.number().int().nonnegative().optional(),
  highlightId: z.string().min(1).optional(),
});

export type FeedCursor = z.infer<typeof FeedCursorSchema>;

const ID_COLUMN: Record<FeedType, string> = {
  submission: 's.id',
  pow: 'p.id',
  'grant-application': 'ga.id',
};

export function encodeCursor(c: FeedCursor): string {
  return Buffer.from(JSON.stringify(c), 'utf8').toString('base64');
}

export function decodeCursor(encoded: string): FeedCursor | null {
  try {
    const raw = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
    const parsed = FeedCursorSchema.safeParse(raw);
    if (!parsed.success) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function addParam(params: unknown[], value: unknown): string {
  params.push(value);
  return '?';
}

interface BranchSql {
  readonly sql: string;
  readonly params: readonly unknown[];
}

// Winner-aware sort date: announced winners sort by the announcement date,
// everything else by createdAt. Matches the createdAt value the API returns.
const SUBMISSION_SORT_DATE =
  'CASE WHEN s.isWinner = 1 AND b.isWinnersAnnounced = 1 AND b.winnersAnnouncedAt IS NOT NULL THEN b.winnersAnnouncedAt ELSE s.createdAt END as sortDate';

function buildSubmissionBranch(filters: FeedFilters): BranchSql {
  const params: unknown[] = [];
  const where: string[] = [];
  where.push(`s.createdAt <= ${addParam(params, filters.endDate)}`);
  if (filters.startDate) {
    where.push(`s.createdAt >= ${addParam(params, filters.startDate)}`);
  }
  if (filters.isWinner) {
    where.push('s.isWinner = 1 AND b.isWinnersAnnounced = 1');
  }
  if (filters.profileUserId) {
    if (filters.shouldIncludeAgentSubmissions && filters.profileAgentId) {
      where.push(
        `(s.userId = ${addParam(params, filters.profileUserId)} OR s.agentId = ${addParam(params, filters.profileAgentId)})`,
      );
    } else {
      where.push(`s.userId = ${addParam(params, filters.profileUserId)}`);
    }
  } else {
    where.push('b.isPrivate = 0');
  }
  const sql = `SELECT s.id, 'submission' as type, ${SUBMISSION_SORT_DATE}, s.likeCount FROM Submission s JOIN Bounties b ON s.listingId = b.id WHERE ${where.join(' AND ')}`;
  return { sql, params };
}

function buildPoWBranch(filters: FeedFilters): BranchSql | null {
  if (filters.isWinner) return null; // PoWs excluded when isWinner filter is active
  const params: unknown[] = [];
  const where: string[] = [];
  where.push(`p.createdAt <= ${addParam(params, filters.endDate)}`);
  if (filters.startDate) {
    where.push(`p.createdAt >= ${addParam(params, filters.startDate)}`);
  }
  if (filters.profileUserId) {
    where.push(`p.userId = ${addParam(params, filters.profileUserId)}`);
  }
  const sql = `SELECT p.id, 'pow' as type, p.createdAt as sortDate, p.likeCount FROM PoW p WHERE ${where.join(' AND ')}`;
  return { sql, params };
}

function buildGrantBranch(filters: FeedFilters): BranchSql {
  const params: unknown[] = [];
  const where: string[] = [];
  where.push(`ga.applicationStatus IN ('Approved', 'Completed')`);
  where.push(`ga.decidedAt <= ${addParam(params, filters.endDate)}`);
  if (filters.startDate) {
    where.push(`ga.decidedAt >= ${addParam(params, filters.startDate)}`);
  }
  if (filters.profileUserId) {
    where.push(`ga.userId = ${addParam(params, filters.profileUserId)}`);
  }
  if (!filters.profileUserId) {
    where.push('g.isPrivate = 0');
  }
  const sql = `SELECT ga.id, 'grant-application' as type, COALESCE(ga.decidedAt, ga.createdAt) as sortDate, ga.likeCount FROM GrantApplication ga JOIN Grants g ON ga.grantId = g.id WHERE ${where.join(' AND ')}`;
  return { sql, params };
}

function getBranch(type: FeedType, filters: FeedFilters): BranchSql | null {
  switch (type) {
    case 'submission':
      return buildSubmissionBranch(filters);
    case 'pow':
      return buildPoWBranch(filters);
    case 'grant-application':
      return buildGrantBranch(filters);
    default:
      return null;
  }
}

function isHighlightInBranches(filters: FeedFilters, hlType?: string): boolean {
  if (!hlType) return false;
  if (hlType === 'submission') {
    return !filters.takeOnlyType || filters.takeOnlyType === 'submission';
  }
  if (hlType === 'pow') {
    return (
      !filters.isWinner &&
      (!filters.takeOnlyType || filters.takeOnlyType === 'pow')
    );
  }
  if (hlType === 'grant-application') {
    return (
      !filters.takeOnlyType || filters.takeOnlyType === 'grant-application'
    );
  }
  return false;
}

function buildHighlightSql(
  hlType: FeedType,
  hlId: string,
  filters: FeedFilters,
): BranchSql | null {
  const branch = getBranch(hlType, filters);
  if (!branch) return null;
  return {
    sql: `${branch.sql} AND ${ID_COLUMN[hlType]} = ?`,
    params: [...branch.params, hlId],
  };
}

const getOrderExpr = (isPopular: boolean): string =>
  isPopular
    ? 'base.likeCount DESC, base.sortDate DESC, base.type DESC, base.id DESC'
    : 'base.sortDate DESC, base.type DESC, base.id DESC';

const getOrderBy = (isPopular: boolean): string => `ORDER BY ${getOrderExpr(isPopular)}`;

export async function getFeedPage(
  filters: FeedFilters,
  cursor: FeedCursor | null,
  take: number,
  skip: number = 0,
): Promise<FeedItem[]> {
  const isPopular = filters.filter === 'popular';
  const branches: BranchSql[] = [];

  if (!filters.takeOnlyType || filters.takeOnlyType === 'submission') {
    branches.push(buildSubmissionBranch(filters));
  }
  const pow = buildPoWBranch(filters);
  if (pow && (!filters.takeOnlyType || filters.takeOnlyType === 'pow')) {
    branches.push(pow);
  }
  if (!filters.takeOnlyType || filters.takeOnlyType === 'grant-application') {
    branches.push(buildGrantBranch(filters));
  }

  if (branches.length === 0) return [];

  const unionSql = branches.map((b) => b.sql).join(' UNION ALL ');
  const branchParams = branches.flatMap((b) => b.params);

  // An effective highlight ID from cursor or initial filter
  const effectiveHighlightId = cursor?.highlightId || filters.highlightId;

  const isEligibleHighlightOnPage1 =
    !cursor &&
    skip === 0 &&
    !!filters.highlightId &&
    !!filters.highlightType &&
    isHighlightInBranches(filters, filters.highlightType);

  const orderBy = getOrderBy(isPopular);
  const params: unknown[] = [];
  let sql: string;

  if (isEligibleHighlightOnPage1) {
    const hlId = filters.highlightId!;
    const hlType = filters.highlightType as FeedType;
    const hl = buildHighlightSql(hlType, hlId, filters);

    // Page 1: pin the highlight on top; fetch base query excluding hlId
    // Pinned highlight is extra (+1), so full regular page size is preserved
    params.push(...hl!.params, ...branchParams, hlId, take, hlId, take + 1);
    sql = `SELECT * FROM ((${hl!.sql}) UNION ALL (SELECT * FROM (${unionSql}) AS base WHERE base.id != ? ${orderBy} LIMIT ?)) AS combined ORDER BY (CASE WHEN id = ? THEN 1 ELSE 0 END) DESC, ${isPopular ? 'likeCount DESC, sortDate DESC, type DESC, id DESC' : 'sortDate DESC, type DESC, id DESC'} LIMIT ?`;
  } else {
    // Normal query (Page 2+ with cursor, or Page 1 without highlight, or backward-compatible skip)
    params.push(...branchParams);
    const whereClauses: string[] = [];

    // Exclude highlighted ID on subsequent pages so it NEVER duplicates anywhere in the feed
    if (effectiveHighlightId) {
      whereClauses.push('base.id != ?');
      params.push(effectiveHighlightId);
    }

    if (cursor) {
      if (isPopular) {
        whereClauses.push('(base.likeCount, base.sortDate, base.type, base.id) < (?, ?, ?, ?)');
        params.push(cursor.likeCount ?? 0, new Date(cursor.sortDate), cursor.type, cursor.id);
      } else {
        whereClauses.push('(base.sortDate, base.type, base.id) < (?, ?, ?)');
        params.push(new Date(cursor.sortDate), cursor.type, cursor.id);
      }
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    if (!cursor && skip > 0) {
      sql = `SELECT * FROM (${unionSql}) AS base ${whereSql} ${orderBy} LIMIT ? OFFSET ?`;
      params.push(take, skip);
    } else {
      sql = `SELECT * FROM (${unionSql}) AS base ${whereSql} ${orderBy} LIMIT ?`;
      params.push(take);
    }
  }

  const rows = await prisma.$queryRawUnsafe<FeedItem[]>(sql, ...params);
  return rows;
}
