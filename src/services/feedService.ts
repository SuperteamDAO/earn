import { prisma } from '@/prisma';

export type FeedType = 'submission' | 'pow' | 'grant-application';

export interface FeedItem {
  id: string;
  type: FeedType;
  sortDate: Date;
  likeCount: number;
}

export interface FeedFilters {
  startDate?: Date;
  endDate: Date;
  isWinner: boolean;
  filter?: 'popular' | 'new';
  profileUserId?: string | null;
  profileAgentId?: string | null;
  shouldIncludeAgentSubmissions: boolean;
  takeOnlyType?: string;
  highlightId?: string;
  highlightType?: string;
}

export interface FeedCursor {
  sortDate?: string;
  likeCount?: number;
  type: FeedType;
  id: string;
}

const ID_COLUMN: Record<FeedType, string> = {
  submission: 's.id',
  pow: 'p.id',
  'grant-application': 'ga.id',
};

const CURSOR_TYPE_COLUMN = 'type';

export function encodeCursor(c: FeedCursor): string {
  return Buffer.from(JSON.stringify(c), 'utf8').toString('base64');
}

export function decodeCursor(encoded: string): FeedCursor | null {
  try {
    const raw = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
    if (typeof raw !== 'object' || raw === null) return null;
    if (typeof raw.id !== 'string') return null;
    if (
      raw.type !== 'submission' &&
      raw.type !== 'pow' &&
      raw.type !== 'grant-application'
    ) {
      return null;
    }
    if (raw.sortDate !== undefined && typeof raw.sortDate !== 'string') return null;
    if (raw.likeCount !== undefined && typeof raw.likeCount !== 'number') return null;
    return raw as FeedCursor;
  } catch {
    return null;
  }
}

function addParam(params: unknown[], value: unknown): string {
  params.push(value);
  return '?';
}

interface BranchSql {
  sql: string;
  params: unknown[];
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

export async function getFeedPage(
  filters: FeedFilters,
  cursor: FeedCursor | null,
  take: number,
): Promise<FeedItem[]> {
  if (filters.takeOnlyType) {
    return getSingleTypePage(filters, cursor, take);
  }
  return getUnionPage(filters, cursor, take);
}

const getOrderExpr = (isPopular: boolean): string =>
  isPopular
    ? 'likeCount DESC, sortDate DESC, type DESC, id DESC'
    : 'sortDate DESC, type DESC, id DESC';

const getOrderBy = (isPopular: boolean): string => `ORDER BY ${getOrderExpr(isPopular)}`;

async function getSingleTypePage(
  filters: FeedFilters,
  cursor: FeedCursor | null,
  take: number,
): Promise<FeedItem[]> {
  const isPopular = filters.filter === 'popular';
  const type = filters.takeOnlyType as FeedType;
  const branch = getBranch(type, filters);
  if (!branch) return [];

  const useHighlight =
    !!filters.highlightId &&
    filters.highlightType === type &&
    isHighlightInBranches(filters, filters.highlightType);

  const orderBy = getOrderBy(isPopular);
  const params: unknown[] = [];
  let sql: string;

  if (useHighlight) {
    const hlId = filters.highlightId!;
    const hl = buildHighlightSql(type, hlId, filters);

    if (cursor) {
      // Pages 2+: exclude the highlight (already shown on page 1), no pin
      params.push(...branch.params, hlId);
      sql = `SELECT * FROM (${branch.sql}) AS base WHERE base.id != ?`;
      if (isPopular) {
        sql += ` AND (likeCount, sortDate, ${CURSOR_TYPE_COLUMN}, id) < (?, ?, ?, ?)`;
        params.push(cursor.likeCount!, cursor.sortDate!, cursor.type, cursor.id);
      } else {
        sql += ` AND (sortDate, ${CURSOR_TYPE_COLUMN}, id) < (?, ?, ?)`;
        params.push(cursor.sortDate!, cursor.type, cursor.id);
      }
      sql += ` ${orderBy} LIMIT ?`;
      params.push(take);
    } else {
      // Page 1: pin the highlight on top; it's extra, so normal page size is kept
      params.push(...hl!.params, ...branch.params, hlId, take, hlId, take + 1);
      sql = `SELECT * FROM ((${hl!.sql}) UNION ALL (SELECT * FROM (${branch.sql}) AS base WHERE base.id != ? ${getOrderBy(isPopular)} LIMIT ?)) AS combined ORDER BY (CASE WHEN id = ? THEN 1 ELSE 0 END) DESC, ${getOrderExpr(isPopular)} LIMIT ?`;
    }
  } else {
    params.push(...branch.params);
    if (cursor) {
      if (isPopular) {
        sql = `SELECT * FROM (${branch.sql}) AS base WHERE (likeCount, sortDate, ${CURSOR_TYPE_COLUMN}, id) < (?, ?, ?, ?) ${orderBy}`;
        params.push(cursor.likeCount!, cursor.sortDate!, cursor.type, cursor.id);
      } else {
        sql = `SELECT * FROM (${branch.sql}) AS base WHERE (sortDate, ${CURSOR_TYPE_COLUMN}, id) < (?, ?, ?) ${orderBy}`;
        params.push(cursor.sortDate!, cursor.type, cursor.id);
      }
    } else {
      sql = `SELECT * FROM (${branch.sql}) AS base ${orderBy}`;
    }
    sql += ` LIMIT ?`;
    params.push(take);
  }

  const rows = await prisma.$queryRawUnsafe<FeedItem[]>(sql, ...params);
  return rows;
}

async function getUnionPage(
  filters: FeedFilters,
  cursor: FeedCursor | null,
  take: number,
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

  const useHighlight =
    !!filters.highlightId &&
    !!filters.highlightType &&
    isHighlightInBranches(filters, filters.highlightType);

  const orderBy = getOrderBy(isPopular);
  const params: unknown[] = [];
  let sql: string;

  if (useHighlight) {
    const hlId = filters.highlightId!;
    const hlType = filters.highlightType as FeedType;
    const hl = buildHighlightSql(hlType, hlId, filters);

    if (cursor) {
      // Pages 2+: exclude the highlight (already shown on page 1), no pin
      params.push(...branchParams, hlId);
      sql = `SELECT * FROM (${unionSql}) AS base WHERE base.id != ?`;
      if (isPopular) {
        sql += ` AND (likeCount, sortDate, ${CURSOR_TYPE_COLUMN}, id) < (?, ?, ?, ?)`;
        params.push(cursor.likeCount!, cursor.sortDate!, cursor.type, cursor.id);
      } else {
        sql += ` AND (sortDate, ${CURSOR_TYPE_COLUMN}, id) < (?, ?, ?)`;
        params.push(cursor.sortDate!, cursor.type, cursor.id);
      }
      sql += ` ${orderBy} LIMIT ?`;
      params.push(take);
    } else {
      // Page 1: pin the highlight on top; it's extra, so normal page size is kept
      params.push(...hl!.params, ...branchParams, hlId, take, hlId, take + 1);
      sql = `SELECT * FROM ((${hl!.sql}) UNION ALL (SELECT * FROM (${unionSql}) AS base WHERE base.id != ? ${getOrderBy(isPopular)} LIMIT ?)) AS combined ORDER BY (CASE WHEN id = ? THEN 1 ELSE 0 END) DESC, ${getOrderExpr(isPopular)} LIMIT ?`;
    }
  } else {
    params.push(...branchParams);
    if (cursor) {
      if (isPopular) {
        sql = `SELECT * FROM (${unionSql}) AS base WHERE (likeCount, sortDate, ${CURSOR_TYPE_COLUMN}, id) < (?, ?, ?, ?) ${orderBy}`;
        params.push(cursor.likeCount!, cursor.sortDate!, cursor.type, cursor.id);
      } else {
        sql = `SELECT * FROM (${unionSql}) AS base WHERE (sortDate, ${CURSOR_TYPE_COLUMN}, id) < (?, ?, ?) ${orderBy}`;
        params.push(cursor.sortDate!, cursor.type, cursor.id);
      }
    } else {
      sql = `SELECT * FROM (${unionSql}) AS base ${orderBy}`;
    }
    sql += ` LIMIT ?`;
    params.push(take);
  }

  const rows = await prisma.$queryRawUnsafe<FeedItem[]>(sql, ...params);
  return rows;
}
