import crypto from 'node:crypto';
import { prisma } from '@/prisma';
import { Prisma } from '@/prisma/client';
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
  sortDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'sortDate must be a valid ISO date string',
  }),
  likeCount: z.number().int().nonnegative().optional(),
  highlightId: z.string().min(1).optional(),
  highlightType: FeedTypeSchema.optional(),
});

export type FeedCursor = z.infer<typeof FeedCursorSchema>;

// Authenticated encryption for cursors using AES-256-GCM.
// Guarantees that internal database IDs of redacted items (such as private grant applications)
// are never exposed in plaintext over the wire or accessible via base64 decoding.
const CURSOR_KEY = crypto
  .createHash('sha256')
  .update(
    process.env.FEED_CURSOR_SECRET ||
      process.env.PRIVY_APP_SECRET ||
      process.env.DATABASE_URL ||
      'superteam-earn-authenticated-feed-cursor-key-32',
  )
  .digest();

export function encodeCursor(c: FeedCursor): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', CURSOR_KEY, iv);
  const plaintext = Buffer.from(JSON.stringify(c), 'utf8');
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Combined format: IV (12 bytes) + Tag (16 bytes) + Ciphertext
  const combined = Buffer.concat([iv, tag, encrypted]);
  return combined.toString('base64url');
}

export function decodeCursor(encoded: string): FeedCursor | null {
  try {
    const combined = Buffer.from(encoded, 'base64url');
    if (combined.length >= 28) {
      const iv = combined.subarray(0, 12);
      const tag = combined.subarray(12, 28);
      const ciphertext = combined.subarray(28);
      const decipher = crypto.createDecipheriv('aes-256-gcm', CURSOR_KEY, iv);
      decipher.setAuthTag(tag);
      const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
      const raw = JSON.parse(decrypted.toString('utf8'));
      const parsed = FeedCursorSchema.safeParse(raw);
      if (parsed.success) return parsed.data;
    }
  } catch {
    // Fall through to legacy fallback if any
  }

  // Graceful fallback for unencrypted base64 JSON cursors during transition
  try {
    const raw = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
    const parsed = FeedCursorSchema.safeParse(raw);
    if (parsed.success) return parsed.data;
  } catch {
    // Ignore fallback failure
  }

  return null;
}

// Winner-aware sort date expression for submissions
const SUBMISSION_SORT_DATE_SQL = Prisma.sql`
  CASE 
    WHEN s.isWinner = 1 AND b.isWinnersAnnounced = 1 AND b.winnersAnnouncedAt IS NOT NULL 
    THEN b.winnersAnnouncedAt 
    ELSE s.createdAt 
  END
`;

function buildSubmissionBranch(
  filters: FeedFilters,
  cursor: FeedCursor | null,
  candidateLimit: number,
  effectiveHighlightId?: string,
  effectiveHighlightType?: string,
): Prisma.Sql {
  const isPopular = filters.filter === 'popular';
  const conditions: Prisma.Sql[] = [
    Prisma.sql`s.createdAt <= ${filters.endDate}`,
  ];

  if (filters.startDate) {
    conditions.push(Prisma.sql`s.createdAt >= ${filters.startDate}`);
  }
  if (filters.isWinner) {
    conditions.push(Prisma.sql`s.isWinner = 1 AND b.isWinnersAnnounced = 1`);
  }
  if (filters.profileUserId) {
    if (filters.shouldIncludeAgentSubmissions && filters.profileAgentId) {
      conditions.push(
        Prisma.sql`(s.userId = ${filters.profileUserId} OR s.agentId = ${filters.profileAgentId})`,
      );
    } else {
      conditions.push(Prisma.sql`s.userId = ${filters.profileUserId}`);
    }
  } else {
    conditions.push(Prisma.sql`b.isPrivate = 0`);
  }

  // Highlight exclusion matching both type AND ID
  if (effectiveHighlightId && effectiveHighlightType === 'submission') {
    conditions.push(Prisma.sql`s.id != ${effectiveHighlightId}`);
  }

  // Keyset seek condition
  if (cursor) {
    const cursorDate = new Date(cursor.sortDate);
    if (isPopular) {
      conditions.push(
        Prisma.sql`(s.likeCount, ${SUBMISSION_SORT_DATE_SQL}, 'submission', s.id) < (${cursor.likeCount ?? 0}, ${cursorDate}, ${cursor.type}, ${cursor.id})`,
      );
    } else {
      conditions.push(
        Prisma.sql`(${SUBMISSION_SORT_DATE_SQL}, 'submission', s.id) < (${cursorDate}, ${cursor.type}, ${cursor.id})`,
      );
    }
  }

  const whereClause = Prisma.join(conditions, ' AND ');
  const branchOrder = isPopular
    ? Prisma.sql`s.likeCount DESC, sortDate DESC, s.id DESC`
    : Prisma.sql`sortDate DESC, s.id DESC`;

  return Prisma.sql`
    (SELECT s.id, 'submission' as type, ${SUBMISSION_SORT_DATE_SQL} as sortDate, s.likeCount 
     FROM Submission s 
     JOIN Bounties b ON s.listingId = b.id 
     WHERE ${whereClause} 
     ORDER BY ${branchOrder} 
     LIMIT ${candidateLimit})
  `;
}

function buildPoWBranch(
  filters: FeedFilters,
  cursor: FeedCursor | null,
  candidateLimit: number,
  effectiveHighlightId?: string,
  effectiveHighlightType?: string,
): Prisma.Sql | null {
  if (filters.isWinner) return null; // PoWs excluded when isWinner is active

  const isPopular = filters.filter === 'popular';
  const conditions: Prisma.Sql[] = [
    Prisma.sql`p.createdAt <= ${filters.endDate}`,
  ];

  if (filters.startDate) {
    conditions.push(Prisma.sql`p.createdAt >= ${filters.startDate}`);
  }
  if (filters.profileUserId) {
    conditions.push(Prisma.sql`p.userId = ${filters.profileUserId}`);
  }

  // Highlight exclusion matching both type AND ID
  if (effectiveHighlightId && effectiveHighlightType === 'pow') {
    conditions.push(Prisma.sql`p.id != ${effectiveHighlightId}`);
  }

  // Keyset seek condition
  if (cursor) {
    const cursorDate = new Date(cursor.sortDate);
    if (isPopular) {
      conditions.push(
        Prisma.sql`(p.likeCount, p.createdAt, 'pow', p.id) < (${cursor.likeCount ?? 0}, ${cursorDate}, ${cursor.type}, ${cursor.id})`,
      );
    } else {
      conditions.push(
        Prisma.sql`(p.createdAt, 'pow', p.id) < (${cursorDate}, ${cursor.type}, ${cursor.id})`,
      );
    }
  }

  const whereClause = Prisma.join(conditions, ' AND ');
  const branchOrder = isPopular
    ? Prisma.sql`p.likeCount DESC, p.createdAt DESC, p.id DESC`
    : Prisma.sql`p.createdAt DESC, p.id DESC`;

  return Prisma.sql`
    (SELECT p.id, 'pow' as type, p.createdAt as sortDate, p.likeCount 
     FROM PoW p 
     WHERE ${whereClause} 
     ORDER BY ${branchOrder} 
     LIMIT ${candidateLimit})
  `;
}

function buildGrantBranch(
  filters: FeedFilters,
  cursor: FeedCursor | null,
  candidateLimit: number,
  effectiveHighlightId?: string,
  effectiveHighlightType?: string,
): Prisma.Sql {
  const isPopular = filters.filter === 'popular';
  const conditions: Prisma.Sql[] = [
    Prisma.sql`ga.applicationStatus IN ('Approved', 'Completed')`,
    Prisma.sql`ga.decidedAt <= ${filters.endDate}`,
  ];

  if (filters.startDate) {
    conditions.push(Prisma.sql`ga.decidedAt >= ${filters.startDate}`);
  }
  if (filters.profileUserId) {
    conditions.push(Prisma.sql`ga.userId = ${filters.profileUserId}`);
  }
  if (!filters.profileUserId) {
    conditions.push(Prisma.sql`g.isPrivate = 0`);
  }

  // Highlight exclusion matching both type AND ID
  if (effectiveHighlightId && effectiveHighlightType === 'grant-application') {
    conditions.push(Prisma.sql`ga.id != ${effectiveHighlightId}`);
  }

  // Keyset seek condition
  if (cursor) {
    const cursorDate = new Date(cursor.sortDate);
    if (isPopular) {
      conditions.push(
        Prisma.sql`(ga.likeCount, COALESCE(ga.decidedAt, ga.createdAt), 'grant-application', ga.id) < (${cursor.likeCount ?? 0}, ${cursorDate}, ${cursor.type}, ${cursor.id})`,
      );
    } else {
      conditions.push(
        Prisma.sql`(COALESCE(ga.decidedAt, ga.createdAt), 'grant-application', ga.id) < (${cursorDate}, ${cursor.type}, ${cursor.id})`,
      );
    }
  }

  const whereClause = Prisma.join(conditions, ' AND ');
  const branchOrder = isPopular
    ? Prisma.sql`ga.likeCount DESC, sortDate DESC, ga.id DESC`
    : Prisma.sql`sortDate DESC, ga.id DESC`;

  return Prisma.sql`
    (SELECT ga.id, 'grant-application' as type, COALESCE(ga.decidedAt, ga.createdAt) as sortDate, ga.likeCount 
     FROM GrantApplication ga 
     JOIN Grants g ON ga.grantId = g.id 
     WHERE ${whereClause} 
     ORDER BY ${branchOrder} 
     LIMIT ${candidateLimit})
  `;
}

function buildHighlightSql(
  hlType: FeedType,
  hlId: string,
  filters: FeedFilters,
): Prisma.Sql | null {
  // Highlight lookup is intentionally NOT bounded by startDate/endDate window,
  // allowing directly linked highlights to be found regardless of active date filters.
  if (hlType === 'submission') {
    const conditions: Prisma.Sql[] = [Prisma.sql`s.id = ${hlId}`];
    if (filters.isWinner) {
      conditions.push(Prisma.sql`s.isWinner = 1 AND b.isWinnersAnnounced = 1`);
    }
    if (filters.profileUserId) {
      if (filters.shouldIncludeAgentSubmissions && filters.profileAgentId) {
        conditions.push(
          Prisma.sql`(s.userId = ${filters.profileUserId} OR s.agentId = ${filters.profileAgentId})`,
        );
      } else {
        conditions.push(Prisma.sql`s.userId = ${filters.profileUserId}`);
      }
    } else {
      conditions.push(Prisma.sql`b.isPrivate = 0`);
    }
    return Prisma.sql`
      SELECT s.id, 'submission' as type, ${SUBMISSION_SORT_DATE_SQL} as sortDate, s.likeCount 
      FROM Submission s 
      JOIN Bounties b ON s.listingId = b.id 
      WHERE ${Prisma.join(conditions, ' AND ')}
      LIMIT 1
    `;
  }

  if (hlType === 'pow') {
    if (filters.isWinner) return null;
    const conditions: Prisma.Sql[] = [Prisma.sql`p.id = ${hlId}`];
    if (filters.profileUserId) {
      conditions.push(Prisma.sql`p.userId = ${filters.profileUserId}`);
    }
    return Prisma.sql`
      SELECT p.id, 'pow' as type, p.createdAt as sortDate, p.likeCount 
      FROM PoW p 
      WHERE ${Prisma.join(conditions, ' AND ')}
      LIMIT 1
    `;
  }

  if (hlType === 'grant-application') {
    const conditions: Prisma.Sql[] = [
      Prisma.sql`ga.id = ${hlId}`,
      Prisma.sql`ga.applicationStatus IN ('Approved', 'Completed')`,
    ];
    if (filters.profileUserId) {
      conditions.push(Prisma.sql`ga.userId = ${filters.profileUserId}`);
    } else {
      conditions.push(Prisma.sql`g.isPrivate = 0`);
    }
    return Prisma.sql`
      SELECT ga.id, 'grant-application' as type, COALESCE(ga.decidedAt, ga.createdAt) as sortDate, ga.likeCount 
      FROM GrantApplication ga 
      JOIN Grants g ON ga.grantId = g.id 
      WHERE ${Prisma.join(conditions, ' AND ')}
      LIMIT 1
    `;
  }

  return null;
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

export interface BuildFeedQueryResult {
  readonly query: Prisma.Sql;
  readonly isEligibleHighlightOnPage1: boolean;
  readonly candidateLimit: number;
}

export function buildFeedQuery(
  filters: FeedFilters,
  cursor: FeedCursor | null,
  take: number,
  skip: number = 0,
): BuildFeedQueryResult | null {
  const isPopular = filters.filter === 'popular';
  // Fetch one extra ordinary candidate to determine whether another page exists,
  // avoiding the classic empty-last-request pagination bug.
  const candidateLimit = take + 1;

  const effectiveHighlightId = cursor?.highlightId || filters.highlightId;
  const effectiveHighlightType = cursor?.highlightType || filters.highlightType;

  const isEligibleHighlightOnPage1 =
    !cursor &&
    skip === 0 &&
    !!filters.highlightId &&
    !!filters.highlightType &&
    isHighlightInBranches(filters, filters.highlightType);

  const branches: Prisma.Sql[] = [];

  if (!filters.takeOnlyType || filters.takeOnlyType === 'submission') {
    branches.push(
      buildSubmissionBranch(
        filters,
        cursor,
        candidateLimit,
        effectiveHighlightId,
        effectiveHighlightType,
      ),
    );
  }

  const pow = buildPoWBranch(
    filters,
    cursor,
    candidateLimit,
    effectiveHighlightId,
    effectiveHighlightType,
  );
  if (pow && (!filters.takeOnlyType || filters.takeOnlyType === 'pow')) {
    branches.push(pow);
  }

  if (!filters.takeOnlyType || filters.takeOnlyType === 'grant-application') {
    branches.push(
      buildGrantBranch(
        filters,
        cursor,
        candidateLimit,
        effectiveHighlightId,
        effectiveHighlightType,
      ),
    );
  }

  if (branches.length === 0) return null;

  const unionSql = Prisma.join(branches, ' UNION ALL ');
  const outerOrder = isPopular
    ? Prisma.sql`likeCount DESC, sortDate DESC, type DESC, id DESC`
    : Prisma.sql`sortDate DESC, type DESC, id DESC`;

  let query: Prisma.Sql;

  if (isEligibleHighlightOnPage1) {
    const hlId = filters.highlightId!;
    const hlType = filters.highlightType as FeedType;
    const hlSql = buildHighlightSql(hlType, hlId, filters);

    if (hlSql) {
      // Pinned highlight on top via CASE WHEN, merged with bounded regular candidates
      query = Prisma.sql`
        SELECT * FROM (
          (${hlSql})
          UNION ALL
          (SELECT * FROM (${unionSql}) AS base_candidates ORDER BY ${outerOrder} LIMIT ${candidateLimit})
        ) AS combined
        ORDER BY (CASE WHEN id = ${hlId} THEN 1 ELSE 0 END) DESC, ${outerOrder}
        LIMIT ${take + 2}
      `;
    } else {
      query = Prisma.sql`
        SELECT * FROM (${unionSql}) AS merged 
        ORDER BY ${outerOrder} 
        LIMIT ${candidateLimit}
      `;
    }
  } else {
    if (!cursor && skip > 0) {
      query = Prisma.sql`
        SELECT * FROM (${unionSql}) AS merged 
        ORDER BY ${outerOrder} 
        LIMIT ${candidateLimit} OFFSET ${skip}
      `;
    } else {
      query = Prisma.sql`
        SELECT * FROM (${unionSql}) AS merged 
        ORDER BY ${outerOrder} 
        LIMIT ${candidateLimit}
      `;
    }
  }

  return { query, isEligibleHighlightOnPage1, candidateLimit };
}

export interface GetFeedPageResult {
  readonly items: FeedItem[];
  readonly hasMore: boolean;
}

export async function getFeedPage(
  filters: FeedFilters,
  cursor: FeedCursor | null,
  take: number,
  skip: number = 0,
): Promise<GetFeedPageResult> {
  const queryResult = buildFeedQuery(filters, cursor, take, skip);
  if (!queryResult) {
    return { items: [], hasMore: false };
  }

  const { query, isEligibleHighlightOnPage1 } = queryResult;
  const rows = await prisma.$queryRaw<FeedItem[]>(query);

  if (rows.length === 0) {
    return { items: [], hasMore: false };
  }

  if (isEligibleHighlightOnPage1 && rows[0].id === filters.highlightId) {
    const highlightItem = rows[0];
    const ordinaryRows = rows.slice(1);
    const hasMore = ordinaryRows.length > take;
    const items = [
      highlightItem,
      ...(hasMore ? ordinaryRows.slice(0, take) : ordinaryRows),
    ];
    return { items, hasMore };
  }

  const hasMore = rows.length > take;
  const items = hasMore ? rows.slice(0, take) : rows;
  return { items, hasMore };
}
