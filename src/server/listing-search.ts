import 'server-only';

import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Schema from 'effect/Schema';

import * as Database from '@/server/database';
import * as HomeChapters from '@/server/home-chapters';
import { combinedRegionsFor } from '@/server/home-regions';

import type { CardSponsor } from '@/features/home/types/cards';
import type {
  GrantsSearch,
  ListingSearch as ListingResult,
  SearchPage,
} from '@/features/search/types';

// A parameter Earn refuses (400), with Earn's words for it.
export class InvalidSearch extends Schema.TaggedError<InvalidSearch>()(
  'InvalidSearch',
  { reason: Schema.String },
) {
  override get message() {
    return this.reason;
  }
}

export class SearchBlocked extends Schema.TaggedError<SearchBlocked>()(
  'SearchBlocked',
  {},
) {
  override get message() {
    return 'User is blocked';
  }
}

export interface SearchParams {
  readonly query: string;
  readonly status: ReadonlyArray<string>;
  readonly skills: ReadonlyArray<string>;
  readonly bountiesLimit: number;
  readonly grantsLimit: number;
  readonly bountiesOffset: number;
  readonly grantsOffset: number;
  // Given by the caller; else the viewer's, from their location.
  readonly userRegion?: ReadonlyArray<string>;
}

// Prisma's `status` enum, which Earn checks the status list against.
const STATUSES = ['OPEN', 'REVIEW', 'CLOSED', 'VERIFYING', 'VERIFY_FAIL'];

const SKILL_GROUPS: Record<string, ReadonlyArray<string>> = {
  DEVELOPMENT: ['Frontend', 'Backend', 'Blockchain', 'Mobile'],
  DESIGN: ['Design'],
  CONTENT: ['Content'],
  OTHER: ['Other', 'Growth', 'Community'],
};

// utils/apiPagination.ts parseBoundedIntegerParam, as the handler used it.
function boundedInteger(
  raw: string | null,
  name: string,
  defaultValue: number,
  maxValue: number,
): number | string {
  if (raw === null) return defaultValue;
  if (!/^\d+$/.test(raw)) return `${name} must be a non-negative integer`;
  const value = Number(raw);
  if (!Number.isSafeInteger(value)) return `${name} is too large`;
  return Math.min(value, maxValue);
}

const list = (raw: string | null) => (raw ? raw.split(',') : []);

// A search request as Earn's /api/search/[query] read it: the query (with
// anything outside its allowed characters made a space), the limits and
// offsets, and the status and skill lists, checked.
export function parseSearchParams(
  rawQuery: string,
  params: URLSearchParams,
): SearchParams | InvalidSearch {
  const numbers = {
    bountiesLimit: boundedInteger(
      params.get('bountiesLimit'),
      'bountiesLimit',
      5,
      25,
    ),
    grantsLimit: boundedInteger(
      params.get('grantsLimit'),
      'grantsLimit',
      2,
      10,
    ),
    bountiesOffset: boundedInteger(
      params.get('bountiesOffset'),
      'bountiesOffset',
      0,
      1000,
    ),
    grantsOffset: boundedInteger(
      params.get('grantsOffset'),
      'grantsOffset',
      0,
      1000,
    ),
  };
  for (const value of Object.values(numbers)) {
    if (typeof value === 'string') return new InvalidSearch({ reason: value });
  }
  const status = list(params.get('status'));
  if (status.some((item) => !STATUSES.includes(item))) {
    return new InvalidSearch({ reason: 'query status is not valid' });
  }
  const skills = list(params.get('skills'));
  if (skills.some((item) => !(item in SKILL_GROUPS))) {
    return new InvalidSearch({ reason: 'query skills is not valid' });
  }
  const userRegion = params.get('userRegion');
  return {
    query: rawQuery.replace(/[^a-zA-Z0-9 _\-@#$.&*():+=]/g, ' '),
    status,
    skills,
    bountiesLimit: Number(numbers.bountiesLimit),
    grantsLimit: Number(numbers.grantsLimit),
    bountiesOffset: Number(numbers.bountiesOffset),
    grantsOffset: Number(numbers.grantsOffset),
    ...(userRegion ? { userRegion: userRegion.split(',') } : {}),
  };
}

// One SQL statement and its bound values, in order.
export interface Statement {
  readonly sql: string;
  readonly values: ReadonlyArray<string | number>;
}

export interface SearchStatements {
  readonly hackathonLookup: Statement;
  readonly bountiesCount: (hackathonId: string | null) => Statement;
  readonly bounties: (hackathonId: string | null, limit: number) => Statement;
  readonly grantsCount: Statement;
  readonly grants: Statement;
  // Whether grants are searched at all (no status, or Open among them).
  readonly withGrants: boolean;
}

// Earn's queries, as pages/api/search/[query].ts built them. One change:
// its grants count asked for `type IN ('bounty', 'hackathon')`, a column
// Grants doesn't have, so every search with grants failed; it's left out.
export function searchStatements(
  params: SearchParams,
  userRegion: ReadonlyArray<string> | undefined,
): SearchStatements {
  const statusQuery: string[] = [];
  if (params.status.includes('OPEN')) {
    statusQuery.push('b.deadline > CURRENT_TIMESTAMP');
  }
  if (params.status.includes('REVIEW')) {
    statusQuery.push(
      'b.deadline <= CURRENT_TIMESTAMP AND b.isWinnersAnnounced = 0',
    );
  }
  if (params.status.includes('CLOSED')) {
    statusQuery.push('b.isWinnersAnnounced = 1');
  }

  const skillsFlattened = params.skills.flatMap(
    (group) => SKILL_GROUPS[group] ?? [],
  );
  const hasSkills = params.skills.length > 0;
  const skillsQuery = skillsFlattened
    .map(
      () =>
        `JSON_CONTAINS(JSON_EXTRACT(b.skills, '$[*].skills'), JSON_QUOTE(?))`,
    )
    .join(' OR ');

  let regionFilter = '';
  if (userRegion?.length) {
    const placeholders = userRegion.map(() => '?').join(',');
    regionFilter = `AND (b.region IN (${placeholders}) OR b.region = 'Global')`;
  }

  const words = params.query
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word !== '');
  const wordClauses = words.map(
    () => `(
b.title LIKE CONCAT('%', ?, '%') OR
s.name LIKE CONCAT('%', ?, '%')
)`,
  );
  const combinedWordClause =
    wordClauses.length > 0 ? wordClauses.join(' AND ') : '1=1';
  const wordValues = words.flatMap((word) => [word, word]);
  const statusClause =
    statusQuery.length > 0 ? ` AND ( ${statusQuery.join(' OR ')} )` : '';
  const skillsClause = hasSkills ? ` AND (${skillsQuery})` : '';
  const regionValues = userRegion?.length ? [...userRegion] : [];

  const bountyWhere = (hackathonId: string | null) => `
    WHERE (1=1) AND (
    b.isPublished = 1 AND
    b.isPrivate = 0 AND
    b.type IN ('bounty', 'hackathon') AND
    (
      ${combinedWordClause}
      ${hackathonId ? `OR b.hackathonId = ?` : ''}
    )
      ${statusClause}
    ) ${skillsClause}
    ${regionFilter}`;
  const bountyValues = (hackathonId: string | null) => [
    ...wordValues,
    ...(hackathonId ? [hackathonId] : []),
    ...(hasSkills ? skillsFlattened : []),
    ...regionValues,
  ];

  const grantValues = [
    ...wordValues,
    ...(hasSkills ? skillsFlattened : []),
    ...regionValues,
  ];
  const grantWhere = `
    WHERE b.isPublished = 1 AND b.isActive = 1 AND b.isArchived = 0 AND b.isPrivate = 0
    AND (${combinedWordClause})
    ${skillsClause}
    ${regionFilter}`;

  return {
    hackathonLookup: {
      sql: `
  SELECT id
  FROM Hackathon
  WHERE name LIKE CONCAT('%', ?, '%')
  LIMIT 1
`,
      values: [params.query],
    },
    bountiesCount: (hackathonId) => ({
      sql: `
    SELECT COUNT(*) as totalCount
    FROM (
    SELECT DISTINCT b.id
    FROM Bounties b
    JOIN Sponsors s ON b.sponsorId = s.id
    ${bountyWhere(hackathonId)}
    ) as subquery;
    `,
      values: bountyValues(hackathonId),
    }),
    bounties: (hackathonId, limit) => ({
      sql: `
    SELECT DISTINCT b.id,
    b.status,
    b.rewardAmount,
    b.deadline,
    b.type,
    JSON_OBJECT('name', s.name, 'logo', s.logo, 'isVerified', s.isVerified, 'slug', s.slug) as sponsor,
    b.title,
    b.token,
    b.slug,
    b.isWinnersAnnounced,
    b.description,
    b.compensationType,
    b.minRewardAsk,
    b.maxRewardAsk,
    b.updatedAt,
    b.winnersAnnouncedAt,
    b.isFeatured,
            JSON_OBJECT(
                'Comments',
                (
                    SELECT COUNT(*)
                    FROM Comment c
                    WHERE c.refId = b.id
                      AND c.isActive = TRUE
                      AND c.isArchived = FALSE
                      AND c.replyToId IS NULL
                      AND c.type != 'SUBMISSION'
                )
            ) AS _count
    FROM Bounties b
    JOIN Sponsors s ON b.sponsorId = s.id
    ${bountyWhere(hackathonId)}
    ORDER BY
      CASE
        WHEN b.isFeatured = 1 AND b.deadline >= CURRENT_TIMESTAMP THEN 1
        ELSE 2
      END,
      CASE
        WHEN b.deadline >= CURRENT_TIMESTAMP THEN 1
        ELSE 2
      END,
      CASE
        WHEN b.deadline >= CURRENT_TIMESTAMP THEN b.deadline
        ELSE NULL
      END ASC,
      CASE
        WHEN b.deadline < CURRENT_TIMESTAMP THEN b.deadline
        ELSE NULL
      END DESC,
      b.updatedAt DESC, b.id
    LIMIT ? ${params.bountiesOffset > 0 ? `OFFSET ?` : ''}
    `,
      values: [
        ...bountyValues(hackathonId),
        limit,
        ...(params.bountiesOffset > 0 ? [params.bountiesOffset] : []),
      ],
    }),
    grantsCount: {
      sql: `
    SELECT COUNT(*) as totalCount
    FROM (
    SELECT DISTINCT b.id
    FROM Grants b
    JOIN Sponsors s ON b.sponsorId = s.id
    WHERE (1=1) AND (
    b.isPublished = 1 AND
    b.isActive = 1 AND
    b.isArchived = 0 AND
    b.isPrivate = 0 AND
    ${combinedWordClause}
    ) ${skillsClause}
    ${regionFilter}
    ) as subquery;
  `,
      values: grantValues,
    },
    grants: {
      sql: `
    SELECT DISTINCT b.id,
    b.title,
    b.slug,
    b.description,
    b.minReward,
    b.maxReward,
    b.token,
    b.link,
    b.region,
    b.createdAt,
    b.updatedAt,
    b.historicalApplications,
    JSON_OBJECT('name', s.name, 'logo', s.logo, 'isVerified', s.isVerified, 'slug', s.slug) as sponsor,
    (
      SELECT COALESCE(SUM(ga.approvedAmountInUSD), 0)
      FROM GrantApplication ga
      WHERE ga.grantId = b.id AND (ga.applicationStatus = 'Approved' OR ga.applicationStatus = 'Completed')
    ) as approvedAmountTotal,
    (
      SELECT COUNT(*)
      FROM GrantApplication ga
      WHERE ga.grantId = b.id AND (ga.applicationStatus = 'Approved' OR ga.applicationStatus = 'Completed')
    ) as approvedApplications
    FROM Grants b
    JOIN Sponsors s ON b.sponsorId = s.id
    ${grantWhere}
    ORDER BY b.createdAt DESC
    LIMIT ? ${params.grantsOffset > 0 ? `OFFSET ?` : ''}
  `,
      values: [
        ...grantValues,
        params.grantsLimit,
        ...(params.grantsOffset > 0 ? [params.grantsOffset] : []),
      ],
    },
    withGrants: params.status.length === 0 || params.status.includes('OPEN'),
  };
}

type Row = Record<string, unknown>;

// JSON_OBJECT columns arrive parsed or as text, depending on the driver.
function jsonColumn(value: unknown): Row {
  if (typeof value === 'string') {
    try {
      const parsed: unknown = JSON.parse(value);
      return typeof parsed === 'object' && parsed !== null ? { ...parsed } : {};
    } catch {
      return {};
    }
  }
  return typeof value === 'object' && value !== null ? { ...value } : {};
}

const str = (value: unknown): string =>
  typeof value === 'string'
    ? value
    : typeof value === 'number' || typeof value === 'bigint'
      ? value.toString()
      : '';
const strOrNull = (value: unknown): string | null =>
  value == null ? null : str(value);
const num = (value: unknown): number => Number(value ?? 0) || 0;
const numOrNull = (value: unknown): number | null =>
  value == null ? null : Number(value);
// MySQL booleans come back as 0/1.
const bool = (value: unknown): boolean =>
  value === true || value === 1 || value === '1' || value === BigInt(1);
const when = (value: unknown): Date | string | null =>
  value instanceof Date || typeof value === 'string' ? value : null;

function sponsorOf(value: unknown): CardSponsor {
  const sponsor = jsonColumn(value);
  return {
    name: str(sponsor.name),
    slug: str(sponsor.slug),
    logo: strOrNull(sponsor.logo),
    isVerified: bool(sponsor.isVerified),
  };
}

const COMPENSATION = ['fixed', 'range', 'variable'] as const;

export function listingResult(row: Row): ListingResult {
  const compensation = COMPENSATION.find(
    (type) => type === row.compensationType,
  );
  return {
    id: str(row.id),
    slug: str(row.slug),
    title: str(row.title),
    type: str(row.type),
    token: strOrNull(row.token),
    rewardAmount: numOrNull(row.rewardAmount),
    deadline: when(row.deadline),
    winnersAnnouncedAt: when(row.winnersAnnouncedAt),
    isWinnersAnnounced: bool(row.isWinnersAnnounced),
    isFeatured: bool(row.isFeatured),
    compensationType: compensation ?? 'fixed',
    minRewardAsk: numOrNull(row.minRewardAsk),
    maxRewardAsk: numOrNull(row.maxRewardAsk),
    _count: { Comments: num(jsonColumn(row._count).Comments) },
    sponsor: sponsorOf(row.sponsor),
    searchType: 'listing',
  };
}

export function grantResult(row: Row): GrantsSearch {
  const approvedApplications = num(row.approvedApplications);
  return {
    id: str(row.id),
    slug: str(row.slug),
    title: str(row.title),
    minReward: numOrNull(row.minReward),
    maxReward: numOrNull(row.maxReward),
    token: strOrNull(row.token),
    approvedAmountTotal: num(row.approvedAmountTotal),
    approvedApplications,
    totalApplications: approvedApplications + num(row.historicalApplications),
    sponsor: sponsorOf(row.sponsor),
    searchType: 'grants',
  };
}

const countOf = (rows: ReadonlyArray<Row>): bigint => {
  const value = rows[0]?.totalCount;
  return typeof value === 'bigint' ? value : BigInt(num(value));
};

export class ListingSearch extends Context.Service<
  ListingSearch,
  {
    // Listings and grants matching the query, as /api/search/[query]
    // answered. `privyDid`: whoever is searching, for their regions.
    readonly search: (
      params: SearchParams,
      privyDid: string | null,
    ) => Effect.Effect<SearchPage, SearchBlocked | Database.DatabaseError>;
  }
>()('earn/ListingSearch') {}

const make = Effect.gen(function* () {
  const database = yield* Database.Database;
  const chapters = yield* HomeChapters.HomeChapters;

  const raw = (operation: string, statement: Statement) =>
    database.query(operation, (client) =>
      client.$queryRawUnsafe<Row[]>(statement.sql, ...statement.values),
    );

  const regionsOf = Effect.fn('ListingSearch.regionsOf')(function* (
    params: SearchParams,
    privyDid: string | null,
  ) {
    if (!privyDid) return params.userRegion;
    const user = yield* database.query('searchViewer', (client) =>
      client.user.findFirst({
        where: { privyDid },
        select: { location: true, isBlocked: true },
      }),
    );
    if (user?.isBlocked) return yield* new SearchBlocked();
    if (params.userRegion) return params.userRegion;
    if (!user?.location) return undefined;
    return combinedRegionsFor(yield* chapters.all, user.location);
  });

  const search = Effect.fn('ListingSearch.search')(function* (
    params: SearchParams,
    privyDid: string | null,
  ) {
    const userRegion = yield* regionsOf(params, privyDid);
    const statements = searchStatements(params, userRegion);
    const [hackathon] = yield* raw(
      'searchHackathon',
      statements.hackathonLookup,
    );
    const hackathonId = hackathon ? str(hackathon.id) : null;

    let grantsCount = BigInt(0);
    let grants: GrantsSearch[] = [];
    if (statements.withGrants) {
      grantsCount = countOf(
        yield* raw('searchGrantsCount', statements.grantsCount),
      );
      grants = (yield* raw('searchGrants', statements.grants)).map(grantResult);
    }
    const bountiesCount = countOf(
      yield* raw('searchBountiesCount', statements.bountiesCount(hackathonId)),
    );
    const bounties = (yield* raw(
      'searchBounties',
      statements.bounties(
        hackathonId,
        Math.max(params.bountiesLimit - grants.length, 0),
      ),
    )).map(listingResult);

    return {
      results: [...bounties, ...grants],
      count: (bountiesCount + grantsCount).toString(),
      bountiesCount: bounties.length,
      grantsCount: grants.length,
    } satisfies SearchPage;
  });

  return ListingSearch.of({ search });
});

export const layer = Layer.effect(ListingSearch, make);
