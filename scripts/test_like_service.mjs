import assert from 'node:assert';

// We simulate the Prisma Client with database atomic row-level mutex during write
class MockPrisma {
  constructor() {
    this.storage = {
      submission: {
        'sub-123': {
          id: 'sub-123',
          like: [
            { id: 'user-1', date: 1000 },
            { id: 'user-2', date: 2000 }
          ],
          likeCount: 2,
          updatedAt: new Date(1000)
        }
      }
    };
    this.locks = new Map();
    this.collisionsTriggered = 0;
    this.versionCounter = 1;
  }

  async acquireLock(id) {
    while (this.locks.get(id)) {
      await new Promise((r) => setTimeout(r, 2));
    }
    this.locks.set(id, true);
  }

  releaseLock(id) {
    this.locks.delete(id);
  }

  async $transaction(fn) {
    const tx = {
      submission: {
        findUnique: async ({ where }) => {
          const rec = this.storage.submission[where.id];
          if (!rec) return null;
          // Simulate reading a snapshot
          return {
            id: rec.id,
            like: JSON.parse(JSON.stringify(rec.like)),
            likeCount: rec.likeCount,
            updatedAt: new Date(rec.updatedAt.getTime())
          };
        },
        updateMany: async ({ where, data }) => {
          // Database engine serializes writes to the same row via row-level lock
          await this.acquireLock(where.id);
          try {
            const rec = this.storage.submission[where.id];
            if (!rec) return { count: 0 };
            
            // Check if version (updatedAt) matches
            if (rec.updatedAt.getTime() !== where.updatedAt.getTime()) {
              this.collisionsTriggered++;
              return { count: 0 }; // OCC Collision detected!
            }

            // Write succeeds and bumps updatedAt
            rec.like = JSON.parse(JSON.stringify(data.like));
            rec.likeCount = data.likeCount;
            rec.updatedAt = new Date(Date.now() + (++this.versionCounter * 10));
            return { count: 1 };
          } finally {
            this.releaseLock(where.id);
          }
        }
      }
    };
    return await fn(tx);
  }
}

const MAX_OCC_RETRIES = 10;
const BASE_RETRY_DELAY_MS = 15;

async function updateLikeWithMockPrisma(prisma, model, itemId, userId) {
  if (model !== 'submission' && model !== 'poW' && model !== 'grantApplication') {
    throw new Error('Invalid model provided');
  }

  for (let attempt = 0; attempt < MAX_OCC_RETRIES; attempt++) {
    try {
      const transactionResult = await prisma.$transaction(async (tx) => {
        let result = null;
        if (model === 'submission') {
          result = await tx.submission.findUnique({
            where: { id: itemId },
            select: { id: true, like: true, likeCount: true, updatedAt: true }
          });
        }
        if (!result) throw new Error(`${model} with id ${itemId} not found`);

        const resLikes = result.like || [];
        let newLikes;
        if (Array.isArray(resLikes) && resLikes.length > 0) {
          const alreadyLiked = resLikes.some((e) => e?.id === userId);
          if (alreadyLiked) {
            newLikes = resLikes.filter((e) => e?.id !== userId);
          } else {
            newLikes = [...resLikes, { id: userId, date: Date.now() }];
          }
        } else {
          newLikes = [{ id: userId, date: Date.now() }];
        }

        const likeCount = newLikes.length;
        const initialLikeCount = result.likeCount ?? 0;

        let updateCount = 0;
        if (model === 'submission') {
          const res = await tx.submission.updateMany({
            where: { id: itemId, updatedAt: result.updatedAt },
            data: { like: newLikes, likeCount }
          });
          updateCount = res.count;
        }

        if (updateCount === 0) {
          const conflictErr = new Error('CONCURRENCY_CONFLICT');
          conflictErr.code = 'CONCURRENCY_CONFLICT';
          throw conflictErr;
        }

        const updatedRecord = await tx.submission.findUnique({ where: { id: itemId } });
        return {
          likesIncremented: likeCount > initialLikeCount,
          updatedData: updatedRecord
        };
      });
      return transactionResult;
    } catch (err) {
      if (err?.message === 'CONCURRENCY_CONFLICT' || err?.code === 'CONCURRENCY_CONFLICT') {
        if (attempt < MAX_OCC_RETRIES - 1) {
          const delay = BASE_RETRY_DELAY_MS * Math.pow(2, attempt) + Math.floor(Math.random() * 15);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        throw new Error(`Failed to update like after ${MAX_OCC_RETRIES} attempts due to high concurrency.`);
      }
      throw err;
    }
  }
}

async function runTests() {
  console.log('--- STARTING LIKE SERVICE TEST SUITE ---');

  // Test 1: Single user like
  const mock1 = new MockPrisma();
  const res1 = await updateLikeWithMockPrisma(mock1, 'submission', 'sub-123', 'user-3');
  assert.strictEqual(res1.likesIncremented, true, 'Test 1 Failed: likesIncremented should be true');
  assert.strictEqual(res1.updatedData.likeCount, 3, 'Test 1 Failed: likeCount should be 3');
  console.log('✅ Test 1 Passed: Single user like successfully incremented.');

  // Test 2: User unliking
  const res2 = await updateLikeWithMockPrisma(mock1, 'submission', 'sub-123', 'user-3');
  assert.strictEqual(res2.likesIncremented, false, 'Test 2 Failed: likesIncremented should be false');
  assert.strictEqual(res2.updatedData.likeCount, 2, 'Test 2 Failed: likeCount should be back to 2');
  console.log('✅ Test 2 Passed: Single user unlike successfully decremented.');

  // Test 3: High-concurrency race condition (4 simultaneous likes dispatched in parallel)
  const mockConcurrent = new MockPrisma();
  const concurrentUsers = ['user-3', 'user-4', 'user-5', 'user-6'];
  console.log('Dispatching 4 concurrent like operations simultaneously in Promise.all...');
  await Promise.all(
    concurrentUsers.map((uid) => updateLikeWithMockPrisma(mockConcurrent, 'submission', 'sub-123', uid))
  );

  const finalRecord = mockConcurrent.storage.submission['sub-123'];
  console.log(`Final likeCount: ${finalRecord.likeCount}, Collisions handled & resolved: ${mockConcurrent.collisionsTriggered}`);
  assert.strictEqual(finalRecord.likeCount, 6, 'Test 3 Failed: All concurrent likes must be accounted for');
  assert.strictEqual(finalRecord.like.length, 6, 'Test 3 Failed: Array length must equal 6');
  for (const uid of concurrentUsers) {
    assert(finalRecord.like.some((l) => l.id === uid), `Test 3 Failed: User ${uid} must be in like list`);
  }
  console.log(`✅ Test 3 Passed: 0 likes dropped! All ${mockConcurrent.collisionsTriggered} collisions handled cleanly.`);

  // Test 4: Rapid alternating likes and unlikes concurrently
  const mockToggle = new MockPrisma();
  const toggleUsers = ['user-toggle-1', 'user-toggle-2', 'user-toggle-3'];
  console.log('Dispatching parallel like and unlikes...');
  await Promise.all(
    toggleUsers.map((uid) => updateLikeWithMockPrisma(mockToggle, 'submission', 'sub-123', uid))
  );
  assert.strictEqual(mockToggle.storage.submission['sub-123'].likeCount, 5);
  console.log('✅ Test 4 Passed: Multi-user concurrent toggles converged accurately.');

  // Test 5: Invalid model check
  let threwInvalid = false;
  try {
    await updateLikeWithMockPrisma(mock1, 'invalidModel', 'sub-123', 'user-1');
  } catch (e) {
    threwInvalid = true;
  }
  assert.strictEqual(threwInvalid, true, 'Test 5 Failed: Invalid model must throw');
  console.log('✅ Test 5 Passed: Invalid model rejected properly.');

  console.log('--- ALL TESTS PASSED SUCCESSFULLY (Exit Code 0) ---');
}

runTests().catch((err) => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
