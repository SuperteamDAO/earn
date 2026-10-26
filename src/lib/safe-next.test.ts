import { describe, expect, it } from 'vitest';

import { safeNext } from './safe-next';

describe('safeNext', () => {
  it('keeps a path on this site, with its query and hash', () => {
    expect(safeNext('/dashboard/logo/edit?tab=rewards#top')).toBe(
      '/dashboard/logo/edit?tab=rewards#top',
    );
    expect(safeNext('/bounties/a%2Fb')).toBe('/bounties/a%2Fb');
  });

  it('never leaves the site, however the address is dressed up', () => {
    const away = [
      '//evil.com',
      '///evil.com',
      '/\\evil.com',
      '\\\\evil.com',
      '/\t/evil.com',
      '/\n/evil.com',
      '/..//evil.com',
      '/./\\evil.com',
      'https://evil.com/dashboard',
      'http:evil.com',
      'javascript:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      ' //evil.com',
    ];
    for (const next of away) {
      const safe = safeNext(next);
      expect(safe.startsWith('/'), next).toBe(true);
      expect(safe.startsWith('//'), next).toBe(false);
      expect(new URL(safe, 'https://earn.invalid').origin, next).toBe(
        'https://earn.invalid',
      );
    }
    // Look-alike slashes are only characters of a path here.
    expect(safeNext('／／evil.com')).toBe('/%EF%BC%8F%EF%BC%8Fevil.com');
  });

  it('goes home for nothing, or for sign-in itself', () => {
    for (const next of [
      null,
      undefined,
      '',
      '/earn/signin',
      '/earn/signin/',
      '/earn/signin/x',
    ]) {
      expect(safeNext(next)).toBe('/earn/');
    }
  });
});
