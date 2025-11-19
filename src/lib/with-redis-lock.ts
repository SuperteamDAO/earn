import { randomUUID } from 'crypto';

import { redis } from './redis';

export interface RedisLockOptions {
  readonly ttlSeconds?: number;
}

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
      const currentToken = await redis.get<string>(key);
      if (currentToken === token) {
        await redis.del(key);
      }
    } catch (releaseError) {
      console.error(
        `Failed to release Redis lock for key="${key}":`,
        releaseError,
      );
    }
  }
}
