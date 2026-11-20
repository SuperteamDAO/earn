import assert from 'node:assert';

// Database simulation with row-level locking (FOR UPDATE) within transaction
class MockDatabase {
  constructor() {
    this.storage = {
      submission: {
        'sub-123': {
          id: 'sub-123',
          like: [
            { id: 'user-1', date: 1000 },
            { id: 'user-2', date: 2000 },
          ],
          likeCount: 2,
        },
      },
      poW: {},
      grantApplication: {},
    };
    this.rowLocks = new Map();
  }

  async acquireRowLock(table, id) {
    const key = `${table}:${id}`;
    while (this.rowLocks.get(key)) {
      await new Promise((r) => setTimeout(r, 2));
    }
    this.rowLocks.set(key, true);
  }

  releaseRowLock(table, id) {
    const key = `${table}:${id}`;
    this.rowLocks.delete(key);
  }

  async $transaction(fn) {
    const lockedRows = [];
    const tx = {
      $queryRaw: async (queryParts, ...values) => {
        const queryStr = Array.isArray(queryParts)
          ? queryParts.join('?')
          : String(queryParts);
        const itemId = values[0];

        let table = 'submission';
        if (queryStr.includes('`Submission`')) table = 'submission';
        else if (queryStr.includes('`PoW`')) table = 'poW';
        else if (queryStr.includes('`GrantApplication`')) table = 'grantApplication';

        if (queryStr.includes('FOR UPDATE')) {
          await this.acquireRowLock(table, itemId);
          lockedRows.push({ table, id: itemId });
        }

        const rec = this.storage[table]?.[itemId];
        if (!rec) return [];
        return [
          {
            id: rec.id,
            like: JSON.parse(JSON.stringify(rec.like)),
            likeCount: rec.likeCount,
          },
        ];
      },
      submission: {
        update: async ({ where, data }) => {
          const rec = this.storage.submission[where.id];
          if (!rec) throw new Error('Record not found');
          rec.like = JSON.parse(JSON.stringify(data.like));
          rec.likeCount = data.likeCount;
          return { ...rec };
        },
      },
      poW: {
        update: async ({ where, data }) => {
          const rec = this.storage.poW[where.id];
          if (!rec) throw new Error('Record not found');
          rec.like = JSON.parse(JSON.stringify(data.like));
          rec.likeCount = data.likeCount;
          return { ...rec };
        },
      },
      grantApplication: {
        update: async ({ where, data }) => {
          const rec = this.storage.grantApplication[where.id];
          if (!rec) throw new Error('Record not found');
          rec.like = JSON.parse(JSON.stringify(data.like));
          rec.likeCount = data.likeCount;
          return { ...rec };
        },
      },
    };

    try {
      return await fn(tx);
    } finally {
      for (const { table, id } of lockedRows) {
        this.releaseRowLock(table, id);
      }
    }
  }
}

// Transactional updateLike implementation under test
async function updateLikeWithDb(db, model, itemId, userId) {
  if (model !== 'submission' && model !== 'poW' && model !== 'grantApplication') {
    throw new Error('Invalid model provided');
  }

  return await db.$transaction(async (tx) => {
    let result = null;

    if (model === 'submission') {
      const rows = await tx.$queryRaw`SELECT id, \`like\`, \`likeCount\` FROM \`Submission\` WHERE id = ${itemId} FOR UPDATE`;
      result = rows[0] || null;
    } else if (model === 'poW') {
      const rows = await tx.$queryRaw`SELECT id, \`like\`, \`likeCount\` FROM \`PoW\` WHERE id = ${itemId} FOR UPDATE`;
      result = rows[0] || null;
    } else if (model === 'grantApplication') {
      const rows = await tx.$queryRaw`SELECT id, \`like\`, \`likeCount\` FROM \`GrantApplication\` WHERE id = ${itemId} FOR UPDATE`;
      result = rows[0] || null;
    }

    if (!result) {
      throw new Error(`Record not found in ${model} with id ${itemId}`);
    }

    let resLikes = [];
    if (Array.isArray(result.like)) {
      resLikes = result.like;
    } else if (typeof result.like === 'string') {
      try {
        resLikes = JSON.parse(result.like);
      } catch {
        resLikes = [];
      }
    }

    let newLikes = [];
    const hasLiked = resLikes.some((e) => e?.id === userId);

    if (hasLiked) {
      newLikes = resLikes.filter((e) => e.id !== userId);
    } else {
      newLikes = [...resLikes, { id: userId, date: Date.now() }];
    }

    const likeCount = newLikes.length;
    let updatedData;

    if (model === 'submission') {
      updatedData = await tx.submission.update({
        where: { id: itemId },
        data: { like: newLikes, likeCount },
      });
    } else if (model === 'poW') {
      updatedData = await tx.poW.update({
        where: { id: itemId },
        data: { like: newLikes, likeCount },
      });
    } else if (model === 'grantApplication') {
      updatedData = await tx.grantApplication.update({
        where: { id: itemId },
        data: { like: newLikes, likeCount },
      });
    }

    return {
      likesIncremented: likeCount > (result.likeCount || 0),
      updatedData,
    };
  });
}

async function runTests() {
  console.log('--- STARTING LIKE SERVICE CONCURRENCY TEST SUITE ---');

  // Test 1: Single user like
  const db1 = new MockDatabase();
  const res1 = await updateLikeWithDb(db1, 'submission', 'sub-123', 'user-3');
  assert.strictEqual(res1.likesIncremented, true, 'Test 1: likesIncremented should be true');
  assert.strictEqual(res1.updatedData.likeCount, 3, 'Test 1: likeCount should be 3');
  console.log('✅ Test 1 Passed: Single user like successfully added.');

  // Test 2: Single user unliking (toggle)
  const res2 = await updateLikeWithDb(db1, 'submission', 'sub-123', 'user-3');
  assert.strictEqual(res2.likesIncremented, false, 'Test 2: likesIncremented should be false');
  assert.strictEqual(res2.updatedData.likeCount, 2, 'Test 2: likeCount should return to 2');
  console.log('✅ Test 2 Passed: Single user unlike toggle works as expected.');

  // Test 3: Concurrent likes with Promise.all for the same item using multiple distinct user IDs
  const dbConcurrent = new MockDatabase();
  const concurrentUsers = ['user-3', 'user-4', 'user-5', 'user-6', 'user-7'];
  console.log(`Dispatching ${concurrentUsers.length} concurrent like operations simultaneously with Promise.all...`);

  await Promise.all(
    concurrentUsers.map((uid) =>
      updateLikeWithDb(dbConcurrent, 'submission', 'sub-123', uid),
    ),
  );

  const finalRecord = dbConcurrent.storage.submission['sub-123'];
  const expectedTotal = 2 + concurrentUsers.length; // initial 2 + 5 new

  console.log(`Final likeCount: ${finalRecord.likeCount}, Expected: ${expectedTotal}`);
  assert.strictEqual(
    finalRecord.likeCount,
    expectedTotal,
    'Test 3: likeCount must match total distinct likes',
  );
  assert.strictEqual(
    finalRecord.like.length,
    expectedTotal,
    'Test 3: like.length must equal likeCount',
  );

  for (const uid of concurrentUsers) {
    assert(
      finalRecord.like.some((l) => l.id === uid),
      `Test 3: User ${uid} must be present in like array`,
    );
  }
  console.log('✅ Test 3 Passed: 0 likes dropped under Promise.all concurrency! All distinct user IDs present.');

  // Test 4: Concurrent toggle (some liking, some unliking)
  const dbToggle = new MockDatabase();
  await Promise.all([
    updateLikeWithDb(dbToggle, 'submission', 'sub-123', 'user-1'), // unlikes -> -1
    updateLikeWithDb(dbToggle, 'submission', 'sub-123', 'user-3'), // likes -> +1
    updateLikeWithDb(dbToggle, 'submission', 'sub-123', 'user-4'), // likes -> +1
  ]);
  const toggleRecord = dbToggle.storage.submission['sub-123'];
  assert.strictEqual(toggleRecord.likeCount, 3, 'Test 4: Expected 3 likes after concurrent toggle');
  assert.strictEqual(
    toggleRecord.like.some((l) => l.id === 'user-1'),
    false,
    'Test 4: user-1 must be removed',
  );
  assert.strictEqual(
    toggleRecord.like.some((l) => l.id === 'user-3'),
    true,
    'Test 4: user-3 must be added',
  );
  assert.strictEqual(
    toggleRecord.like.some((l) => l.id === 'user-4'),
    true,
    'Test 4: user-4 must be added',
  );
  console.log('✅ Test 4 Passed: Concurrent mixed like/unlike operations resolved cleanly.');

  // Test 5: Invalid model rejection
  let threw = false;
  try {
    await updateLikeWithDb(db1, 'invalidModel', 'sub-123', 'user-99');
  } catch {
    threw = true;
  }
  assert.strictEqual(threw, true, 'Test 5: Must throw on invalid model');
  console.log('✅ Test 5 Passed: Invalid model rejected properly.');

  console.log('--- ALL CONCURRENCY & INTEGRATION TESTS PASSED (Exit Code 0) ---');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
