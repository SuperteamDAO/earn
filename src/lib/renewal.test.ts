import { describe, expect, it } from 'vitest';

import { confirmDelay, retryDelay } from './renewal';

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;
const NOW = 1_800_000_000_000;

describe('scheduling', () => {
  it('has Privy vouch again once the session is a day old', () => {
    expect(confirmDelay(NOW - 20 * MINUTE, NOW)).toBe(DAY - 20 * MINUTE);
    expect(confirmDelay(NOW - 3 * DAY, NOW)).toBe(0);
  });

  it('issues Skyhook’s own session at once when there is none', () => {
    expect(confirmDelay(null, NOW)).toBe(0);
  });

  it('backs off retries up to a quarter of an hour', () => {
    expect([1, 2, 3, 4, 5, 6].map(retryDelay)).toEqual(
      [1, 2, 4, 8, 15, 15].map((minutes) => minutes * MINUTE),
    );
  });
});
