import { randomUUID } from 'crypto';

import { redis } from './redis';

interface RedisLockOptions {
  readonly ttlSeconds?: number;
}

// Compare-and-delete, so a holder can only ever release its own lock.
const RELEASE_LOCK_SCRIPT = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
end
return 0
`;

export class LockNotAcquiredError extends Error {
  public constructor(key: string) {
    super(`Failed to acquire Redis lock for key="${key}"`);
    this.name = 'LockNotAcquiredError';
  }
}

export async function withRedisLock<TResult>(
  key: string,
  callback: () => Promise<TResult>,
  options?: RedisLockOptions,
): Promise<TResult> {
  const ttlSeconds = options?.ttlSeconds ?? 300;
  const token = randomUUID();
  const acquired = await redis.set(key, token, { nx: true, ex: ttlSeconds });

  if (acquired !== 'OK') {
    throw new LockNotAcquiredError(key);
  }

  try {
    return await callback();
  } finally {
    try {
      await redis.eval(RELEASE_LOCK_SCRIPT, [key], [token]);
    } catch (releaseError) {
      console.error(
        `Failed to release Redis lock for key="${key}":`,
        releaseError,
      );
    }
  }
}
