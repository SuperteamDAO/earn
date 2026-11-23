// Run with Node 24+: node --test tests/feed-highlight-visibility.test.mjs
// Handler-level tests with an in-memory Prisma substitute, not database tests.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { test } from 'node:test';

// The endpoint's imports are replaced only at this test boundary. Execute the
// actual handler/serialization so the assertions cover responses, not mock calls.
const source = readFileSync(
  new URL('../src/pages/api/feed/get.ts', import.meta.url),
  'utf8',
);
const handlerCode = stripTypeScriptTypes(source)
  .replace(/^import[\s\S]*?;\s*$/gm, '')
  .replace('export default async function handler', 'async function handler');
const now = new Date('2026-01-01T00:00:00Z');
const user = {
  id: 'author',
  firstName: 'Test',
  lastName: 'Author',
  photo: null,
  username: 'test-author',
};

function fixture(kind, isPrivate) {
  const listing = {
    id: 'listing',
    title: 'Fixture listing',
    slug: 'fixture-listing',
    isPrivate,
    isWinnersAnnounced: true,
    winnersAnnouncedAt: now,
    sponsor: { name: 'Fixture sponsor', logo: null, slug: 'fixture-sponsor' },
    token: 'USDC',
    rewards: {},
    type: 'bounty',
  };
  return {
    id: 'highlight',
    userId: user.id,
    user,
    createdAt: now,
    decidedAt: now,
    applicationStatus: 'Approved',
    isWinner: true,
    winnerPosition: 1,
    link: 'https://example.com/work',
    tweet: 'https://example.com/post',
    otherInfo: 'Fixture details',
    like: [],
    likeCount: 0,
    Comments: [],
    _count: { Comments: 0 },
    approvedAmount: 25,
    ...(kind === 'submission' ? { listing } : { grant: listing }),
  };
}

// Only the predicates relevant to these fixtures are emulated. Prisma itself
// enforces these predicates in production; integration SQL is not exercised.
function matches(row, where) {
  if (!where) return true;
  if (where.AND && !where.AND.every((clause) => matches(row, clause)))
    return false;
  if (where.OR && !where.OR.some((clause) => matches(row, clause)))
    return false;
  for (const [key, value] of Object.entries(where)) {
    if (key === 'AND' || key === 'OR') continue;
    if (value === undefined) continue;
    if (typeof value === 'object' && value !== null) {
      if (key === 'createdAt' || key === 'decidedAt') {
        if (value.gte && row[key] < value.gte) return false;
        if (value.lte && row[key] > value.lte) return false;
      } else if (!matches(row[key], value)) return false;
    } else if (row[key] !== value) return false;
  }
  return true;
}

async function getFeed({
  kind,
  isPrivate,
  profile,
  owner = false,
  skip = 0,
  status = 'Approved',
}) {
  const record = fixture(kind, isPrivate);
  if (kind === 'grant-application') record.applicationStatus = status;
  const model = {
    // Keep the requested item outside the normal page to exercise the fallback
    // highlight lookup (as happens with a link to an older item).
    findMany: async () => [],
    findFirst: async ({ where }) => (matches(record, where) ? record : null),
    findUnique: async ({ where }) => (matches(record, where) ? record : null),
  };
  const empty = {
    findMany: async () => [],
    findUnique: async () => null,
    findFirst: async () => null,
  };
  const prisma = {
    user: {
      findUnique: async ({ where }) =>
        where.privyDid ? { id: user.id } : user,
    },
    submission: kind === 'submission' ? model : empty,
    poW: empty,
    grantApplication: kind === 'grant-application' ? model : empty,
  };
  const build = new Function(
    'prisma',
    'logger',
    'parseBoundedIntegerParam',
    'getPrivyToken',
    'getCloudinaryFetchUrl',
    'dayjs',
    'safeStringify',
    `${handlerCode}; return handler;`,
  );
  const handler = build(
    prisma,
    { debug() {}, info() {}, error() {} },
    (value, options) => ({
      ok: true,
      value: value === undefined ? options.defaultValue : Number(value),
    }),
    async () => (owner ? 'owner-did' : null),
    (value) => value,
    () => ({ subtract: () => ({ toDate: () => now }) }),
    JSON.stringify,
  );
  let code, body;
  await handler(
    {
      query: {
        highlightId: record.id,
        highlightType: kind,
        skip: String(skip),
        ...(profile ? { userId: profile } : {}),
      },
    },
    {
      status(value) {
        code = value;
        return this;
      },
      json(value) {
        body = value;
      },
    },
  );
  assert.equal(code, 200);
  return body;
}

for (const kind of ['submission', 'grant-application']) {
  test(`${kind}: public feed excludes a private highlight`, async () => {
    assert.deepEqual(await getFeed({ kind, isPrivate: true }), []);
  });
  test(`${kind}: public highlight remains available`, async () => {
    const result = await getFeed({ kind, isPrivate: false });
    assert.equal(result.length, 1);
    assert.equal(result[0].id, 'highlight');
    assert.equal(result[0].listingTitle, 'Fixture listing');
  });
  test(`${kind}: non-owner profile keeps redacted private activity`, async () => {
    const result = await getFeed({ kind, isPrivate: true, profile: user.id });
    assert.equal(result.length, 1);
    for (const key of [
      'id',
      'listingId',
      'listingTitle',
      'listingSlug',
      'sponsorName',
      'sponsorSlug',
    ]) {
      assert.equal(result[0][key], null);
    }
    assert.equal(result[0].isPrivate, true);
    if (kind === 'submission') {
      for (const key of ['link', 'tweet', 'otherInfo'])
        assert.equal(result[0][key], null);
    }
  });
  test(`${kind}: owner profile retains private highlight details`, async () => {
    const result = await getFeed({
      kind,
      isPrivate: true,
      profile: user.id,
      owner: true,
    });
    assert.equal(result.length, 1);
    assert.equal(result[0].id, 'highlight');
    assert.equal(result[0].listingTitle, 'Fixture listing');
    assert.equal(result[0].isPrivate, false);
    if (kind === 'submission')
      assert.equal(result[0].link, 'https://example.com/work');
  });
  test(`${kind}: highlight must belong to requested profile`, async () => {
    assert.deepEqual(
      await getFeed({ kind, isPrivate: false, profile: 'other-user' }),
      [],
    );
  });
  test(`${kind}: later pages do not use fallback highlight lookup`, async () => {
    assert.deepEqual(await getFeed({ kind, isPrivate: false, skip: 15 }), []);
  });
}
test('unapproved grant is not surfaced as a highlight', async () => {
  assert.deepEqual(
    await getFeed({
      kind: 'grant-application',
      isPrivate: false,
      status: 'Pending',
    }),
    [],
  );
});
test('rejected grant is not surfaced as a highlight', async () => {
  assert.deepEqual(
    await getFeed({
      kind: 'grant-application',
      isPrivate: false,
      status: 'Rejected',
    }),
    [],
  );
});
test('completed public grant remains available as a highlight', async () => {
  const result = await getFeed({
    kind: 'grant-application',
    isPrivate: false,
    status: 'Completed',
  });
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 'highlight');
});
