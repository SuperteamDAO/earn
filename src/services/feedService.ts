import { prisma } from '@/prisma';

export interface FeedItem {
  id: string;
  type: 'submission' | 'pow' | 'grant-application';
  sortDate: Date;
  likeCount: number;
  createdAt: Date;
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
  createdAt?: string;
  id: string;
}

export function encodeCursor(c: FeedCursor): string {
  return Buffer.from(JSON.stringify(c), 'utf8').toString('base64');
}

export function decodeCursor(encoded: string): FeedCursor | null {
  try {
    const raw = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
    if (typeof raw !== 'object' || raw === null || typeof raw.id !== 'string') {
      return null;
    }
    if (raw.sortDate !== undefined && typeof raw.sortDate !== 'string') return null;
    if (raw.likeCount !== undefined && typeof raw.likeCount !== 'number') return null;
    if (raw.createdAt !== undefined && typeof raw.createdAt !== 'string') return null;
    return raw as FeedCursor;
  } catch {
    return null;
  }
}

function addParam(params: unknown[], value: unknown): string {
  params.push(value);
  return '?';
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

async function getSingleTypePage(
  filters: FeedFilters,
  cursor: FeedCursor | null,
  take: number,
): Promise<FeedItem[]> {
  const isPopular = filters.filter === 'popular';
  const params: unknown[] = [];

  let sql = '';

  switch (filters.takeOnlyType) {
    case 'submission': {
      sql = `SELECT s.id, 'submission' as type, COALESCE(b.winnersAnnouncedAt, s.createdAt) as sortDate, s.likeCount, s.createdAt FROM Submission s JOIN Bounties b ON s.listingId = b.id`;
      const subWhere: string[] = [];
      subWhere.push(`s.createdAt <= ${addParam(params, filters.endDate)}`);
      if (filters.startDate) subWhere.push(`s.createdAt >= ${addParam(params, filters.startDate)}`);
      if (filters.isWinner) {
        subWhere.push('s.isWinner = 1 AND b.isWinnersAnnounced = 1');
      }
      if (filters.profileUserId) {
        if (filters.shouldIncludeAgentSubmissions && filters.profileAgentId) {
          subWhere.push(`(s.userId = ${addParam(params, filters.profileUserId)} OR s.agentId = ${addParam(params, filters.profileAgentId)})`);
        } else {
          subWhere.push(`s.userId = ${addParam(params, filters.profileUserId)}`);
        }
      } else {
        subWhere.push('b.isPrivate = 0');
      }
      sql += ' WHERE ' + subWhere.join(' AND ');
      break;
    }
    case 'pow': {
      sql = `SELECT p.id, 'pow' as type, p.createdAt as sortDate, p.likeCount, p.createdAt FROM PoW p`;
      const powWhere: string[] = [];
      powWhere.push(`p.createdAt <= ${addParam(params, filters.endDate)}`);
      if (filters.startDate) powWhere.push(`p.createdAt >= ${addParam(params, filters.startDate)}`);
      if (filters.profileUserId) powWhere.push(`p.userId = ${addParam(params, filters.profileUserId)}`);
      if (filters.isWinner) return []; // PoWs excluded when isWinner filter is active
      sql += ' WHERE ' + powWhere.join(' AND ');
      break;
    }
    case 'grant-application': {
      sql = `SELECT ga.id, 'grant-application' as type, COALESCE(ga.decidedAt, ga.createdAt) as sortDate, ga.likeCount, ga.createdAt FROM GrantApplication ga JOIN Grants g ON ga.grantId = g.id`;
      const gaWhere: string[] = [];
      gaWhere.push(`ga.applicationStatus IN ('Approved', 'Completed')`);
      gaWhere.push(`ga.decidedAt <= ${addParam(params, filters.endDate)}`);
      if (filters.startDate) gaWhere.push(`ga.decidedAt >= ${addParam(params, filters.startDate)}`);
      if (filters.profileUserId) gaWhere.push(`ga.userId = ${addParam(params, filters.profileUserId)}`);
      if (!filters.profileUserId) gaWhere.push('g.isPrivate = 0');
      sql += ' WHERE ' + gaWhere.join(' AND ');
      break;
    }
    default:
      return [];
  }

  const branchParams = [...params];

  // Handle highlight
  if (filters.highlightId && filters.highlightType === filters.takeOnlyType) {
    // Final SQL: (hlSql) UNION ALL (SELECT * FROM (branchSql) AS base WHERE base.id != ?)
    // Params: [hlId, ...branchParams, hlId, hlId, take]
    const hlId = filters.highlightId;
    const hlType = filters.takeOnlyType!;

    let hlSql: string;
    switch (hlType) {
      case 'submission':
        hlSql = `SELECT s.id, 'submission' as type, COALESCE(b.winnersAnnouncedAt, s.createdAt) as sortDate, s.likeCount, s.createdAt FROM Submission s JOIN Bounties b ON s.listingId = b.id WHERE s.id = ?`;
        break;
      case 'pow':
        hlSql = `SELECT p.id, 'pow' as type, p.createdAt as sortDate, p.likeCount, p.createdAt FROM PoW p WHERE p.id = ?`;
        break;
      case 'grant-application':
        hlSql = `SELECT ga.id, 'grant-application' as type, COALESCE(ga.decidedAt, ga.createdAt) as sortDate, ga.likeCount, ga.createdAt FROM GrantApplication ga WHERE ga.id = ?`;
        break;
      default:
        hlSql = '';
    }

    params.length = 0;
    params.push(hlId); // hlSql WHERE id=?
    params.push(...branchParams); // branch WHERE conditions
    params.push(hlId); // base WHERE id != ?
    params.push(hlId); // CASE WHEN id=?
    params.push(take); // LIMIT

    const baseSql = `SELECT * FROM (${sql}) AS base WHERE base.id != ?`;
    if (isPopular) {
      sql = `SELECT * FROM ((${hlSql}) UNION ALL (${baseSql})) AS combined ORDER BY (CASE WHEN id = ? THEN 1 ELSE 0 END) DESC, likeCount DESC, createdAt DESC, id DESC LIMIT ?`;
    } else {
      sql = `SELECT * FROM ((${hlSql}) UNION ALL (${baseSql})) AS combined ORDER BY (CASE WHEN id = ? THEN 1 ELSE 0 END) DESC, sortDate DESC, id DESC LIMIT ?`;
    }
  } else {
    params.length = 0;
    params.push(...branchParams);

    if (cursor) {
      // Wrap in derived table so sortDate / likeCount / createdAt are referenceable
      if (isPopular) {
        sql = `SELECT * FROM (${sql}) AS base WHERE (likeCount, createdAt, id) < (?, ?, ?) ORDER BY likeCount DESC, createdAt DESC, id DESC`;
        params.push(cursor.likeCount!, cursor.createdAt!, cursor.id);
      } else {
        sql = `SELECT * FROM (${sql}) AS base WHERE (sortDate, id) < (?, ?) ORDER BY sortDate DESC, id DESC`;
        params.push(cursor.sortDate!, cursor.id);
      }
    } else {
      if (isPopular) {
        sql += ` ORDER BY likeCount DESC, createdAt DESC, id DESC`;
      } else {
        sql += ` ORDER BY sortDate DESC, id DESC`;
      }
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
  const useHighlight = filters.highlightId && filters.highlightType;
  const branches: string[] = [];
  const branchParams: unknown[] = [];

  // Submission branch
  if (!filters.takeOnlyType || filters.takeOnlyType === 'submission') {
    let subSql = `SELECT s.id, 'submission' as type, COALESCE(b.winnersAnnouncedAt, s.createdAt) as sortDate, s.likeCount, s.createdAt FROM Submission s JOIN Bounties b ON s.listingId = b.id WHERE s.createdAt <= ${addParam(branchParams, filters.endDate)}`;
    if (filters.startDate) subSql += ` AND s.createdAt >= ${addParam(branchParams, filters.startDate)}`;
    if (filters.isWinner) subSql += ' AND s.isWinner = 1 AND b.isWinnersAnnounced = 1';
    if (filters.profileUserId) {
      if (filters.shouldIncludeAgentSubmissions && filters.profileAgentId) {
        subSql += ` AND (s.userId = ${addParam(branchParams, filters.profileUserId)} OR s.agentId = ${addParam(branchParams, filters.profileAgentId)})`;
      } else {
        subSql += ` AND s.userId = ${addParam(branchParams, filters.profileUserId)}`;
      }
    } else {
      subSql += ' AND b.isPrivate = 0';
    }
    branches.push(subSql);
  }

  // PoW branch
  if (!filters.isWinner && (!filters.takeOnlyType || filters.takeOnlyType === 'pow')) {
    let powSql = `SELECT p.id, 'pow' as type, p.createdAt as sortDate, p.likeCount, p.createdAt FROM PoW p WHERE p.createdAt <= ${addParam(branchParams, filters.endDate)}`;
    if (filters.startDate) powSql += ` AND p.createdAt >= ${addParam(branchParams, filters.startDate)}`;
    if (filters.profileUserId) powSql += ` AND p.userId = ${addParam(branchParams, filters.profileUserId)}`;
    branches.push(powSql);
  }

  // GrantApplication branch
  if (!filters.takeOnlyType || filters.takeOnlyType === 'grant-application') {
    let gaSql = `SELECT ga.id, 'grant-application' as type, COALESCE(ga.decidedAt, ga.createdAt) as sortDate, ga.likeCount, ga.createdAt FROM GrantApplication ga JOIN Grants g ON ga.grantId = g.id WHERE ga.applicationStatus IN ('Approved', 'Completed') AND ga.decidedAt <= ${addParam(branchParams, filters.endDate)}`;
    if (filters.startDate) gaSql += ` AND ga.decidedAt >= ${addParam(branchParams, filters.startDate)}`;
    if (filters.profileUserId) gaSql += ` AND ga.userId = ${addParam(branchParams, filters.profileUserId)}`;
    if (!filters.profileUserId) gaSql += ' AND g.isPrivate = 0';
    branches.push(gaSql);
  }

  if (branches.length === 0) return [];

  const unionSql = branches.join(' UNION ALL ');
  const params: unknown[] = [];

  // Check if highlight matches any branch
  const hlId = filters.highlightId;
  const hlType = filters.highlightType;
  const isInBranches = useHighlight && (
    (hlType === 'submission' && (!filters.takeOnlyType || filters.takeOnlyType === 'submission')) ||
    (hlType === 'pow' && !filters.isWinner && (!filters.takeOnlyType || filters.takeOnlyType === 'pow')) ||
    (hlType === 'grant-application' && (!filters.takeOnlyType || filters.takeOnlyType === 'grant-application'))
  );

  // Build the final SQL and params array in the correct order (params must match ? appearance order)
  let sql: string;

  if (isInBranches) {
    // Highlight path: final SQL structure is
    // (hlSql) UNION ALL (SELECT * FROM (unionSql) AS base WHERE base.id != ?)
    // ORDER BY CASE WHEN id=? THEN 1 ELSE 0 END DESC, ... LIMIT ?
    // Params order: [hl_param, ...branchParams, exclude_param, case_param, limit_param]

    let hlSql: string;
    switch (hlType) {
      case 'submission':
        hlSql = `SELECT s.id, 'submission' as type, COALESCE(b.winnersAnnouncedAt, s.createdAt) as sortDate, s.likeCount, s.createdAt FROM Submission s JOIN Bounties b ON s.listingId = b.id WHERE s.id = ?`;
        break;
      case 'pow':
        hlSql = `SELECT p.id, 'pow' as type, p.createdAt as sortDate, p.likeCount, p.createdAt FROM PoW p WHERE p.id = ?`;
        break;
      case 'grant-application':
        hlSql = `SELECT ga.id, 'grant-application' as type, COALESCE(ga.decidedAt, ga.createdAt) as sortDate, ga.likeCount, ga.createdAt FROM GrantApplication ga WHERE ga.id = ?`;
        break;
      default:
        hlSql = '';
    }

    params.push(hlId!); // hlSql WHERE id=?
    params.push(...branchParams); // union branches
    params.push(hlId!); // base WHERE id != ?
    params.push(hlId!); // CASE WHEN id=?
    params.push(take); // LIMIT

    const baseSql = `SELECT * FROM (${unionSql}) AS base WHERE base.id != ?`;
    if (isPopular) {
      sql = `SELECT * FROM ((${hlSql}) UNION ALL (${baseSql})) AS combined ORDER BY (CASE WHEN id = ? THEN 1 ELSE 0 END) DESC, likeCount DESC, createdAt DESC, id DESC LIMIT ?`;
    } else {
      sql = `SELECT * FROM ((${hlSql}) UNION ALL (${baseSql})) AS combined ORDER BY (CASE WHEN id = ? THEN 1 ELSE 0 END) DESC, sortDate DESC, id DESC LIMIT ?`;
    }
  } else {
    // No highlight (or highlight not in branches): push branchParams, then cursor/pagination params
    params.push(...branchParams);

    if (cursor) {
      if (isPopular) {
        sql = `SELECT * FROM (${unionSql}) AS base WHERE (likeCount, createdAt, id) < (?, ?, ?)`;
        params.push(cursor.likeCount!, cursor.createdAt!, cursor.id);
      } else {
        sql = `SELECT * FROM (${unionSql}) AS base WHERE (sortDate, id) < (?, ?)`;
        params.push(cursor.sortDate!, cursor.id);
      }
    } else {
      sql = `SELECT * FROM (${unionSql}) AS base`;
    }

    if (isPopular) sql += ' ORDER BY likeCount DESC, createdAt DESC, id DESC';
    else sql += ' ORDER BY sortDate DESC, id DESC';
    sql += ' LIMIT ?';
    params.push(take);
  }

  const rows = await prisma.$queryRawUnsafe<FeedItem[]>(sql, ...params);
  return rows;
}

export async function getFeedLikes(
  subIds: string[],
  powIds: string[],
  gaIds: string[],
): Promise<{
  subLikes: { targetId: string; userId: string; createdAt: Date }[];
  poWLikes: { targetId: string; userId: string; createdAt: Date }[];
  gaLikes: { targetId: string; userId: string; createdAt: Date }[];
}> {
  const [subLikes, poWLikes, gaLikes] = await Promise.all([
    subIds.length > 0
      ? prisma.likes.findMany({
          where: { targetType: 'SUBMISSION', targetId: { in: subIds } },
          select: { targetId: true, userId: true, createdAt: true },
        })
      : [],
    powIds.length > 0
      ? prisma.likes.findMany({
          where: { targetType: 'POW', targetId: { in: powIds } },
          select: { targetId: true, userId: true, createdAt: true },
        })
      : [],
    gaIds.length > 0
      ? prisma.likes.findMany({
          where: { targetType: 'GRANT_APPLICATION', targetId: { in: gaIds } },
          select: { targetId: true, userId: true, createdAt: true },
        })
      : [],
  ]);
  return { subLikes, poWLikes, gaLikes };
}
