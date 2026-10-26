import { assert, describe, it } from '@effect/vitest';

import {
  allowedRegion,
  type ListingBody,
  type RuleContext,
  validateListing,
  widensToGlobal,
} from '@/server/listing-rules';
import { normalizeTokenIcon } from '@/server/tokens';

const NOW = Date.parse('2026-10-20T12:00:00Z');
const DAY = 86_400_000;

const body = (overrides: Partial<ListingBody> = {}): ListingBody => ({
  id: 'b1',
  title: 'Design a logo',
  slug: '-design-a-logo-',
  pocSocials: 'https://x.com/acme',
  description: '<p>Make us a logo.</p>',
  type: 'bounty',
  region: 'uk',
  deadline: new Date(NOW + 7 * DAY).toISOString(),
  commitmentDate: new Date(NOW + 21 * DAY).toISOString(),
  skills: [{ skills: 'Design', subskills: ['Graphic Design'] }],
  token: 'USDC',
  rewardAmount: 900,
  rewards: { '1': 500, '2': 300, '99': 50 },
  maxBonusSpots: 2,
  compensationType: 'fixed',
  ...overrides,
});

const context: RuleContext = {
  isGod: false,
  isEditing: false,
  isST: false,
  hackathon: null,
  pastDeadline: null,
  now: NOW,
};

const facts = { slugTaken: false, tokenAllowed: true };

const errorsOf = (
  overrides: Partial<ListingBody>,
  ctx: Partial<RuleContext> = {},
  fact: Partial<typeof facts> = {},
) => {
  const result = validateListing(
    body(overrides),
    { ...context, ...ctx },
    { ...facts, ...fact },
  );
  return 'errors' in result ? result.errors : {};
};

describe('validateListing', () => {
  it('normalizes a valid listing as Earn’s schema did', () => {
    const result = validateListing(body(), context, facts);
    assert.isTrue('listing' in result);
    if (!('listing' in result)) return;
    assert.strictEqual(result.listing.slug, 'design-a-logo');
    assert.strictEqual(result.listing.region, 'United Kingdom');
    assert.strictEqual(result.listing.isFndnPaying, false);
  });

  it('wants the rewards to add up, bonus spots included', () => {
    assert.strictEqual(
      errorsOf({ rewardAmount: 850 }).rewards,
      'Total of rewards must equal the reward amount',
    );
    assert.strictEqual(
      errorsOf({ maxBonusSpots: 0, rewardAmount: 800 }).maxBonusSpots,
      'Required',
    );
    assert.strictEqual(
      errorsOf({ rewards: { '1': 500, '3': 300, '99': 50 } }).rewards,
      'Reward positions must be sequential starting from 1',
    );
  });

  it('keeps deadlines in the future and extensions within two weeks', () => {
    assert.strictEqual(
      errorsOf({ deadline: new Date(NOW - DAY).toISOString() }).deadline,
      'Deadline cannot be in the past',
    );
    assert.isUndefined(
      errorsOf({ deadline: new Date(NOW - DAY).toISOString() }, { isGod: true })
        .deadline,
    );
    assert.strictEqual(
      errorsOf(
        {
          deadline: new Date(NOW + 30 * DAY).toISOString(),
          commitmentDate: new Date(NOW + 40 * DAY).toISOString(),
        },
        { isEditing: true, pastDeadline: new Date(NOW + 7 * DAY) },
      ).deadline,
      'Cannot extend deadline more than 2 weeks from original deadline',
    );
  });

  it('puts winners 1 to 30 days after the deadline', () => {
    assert.strictEqual(
      errorsOf({ commitmentDate: new Date(NOW + 7 * DAY).toISOString() })
        .commitmentDate,
      'Winner announcement date must be at least 1 day after the deadline',
    );
    assert.strictEqual(
      errorsOf({ commitmentDate: new Date(NOW + 40 * DAY).toISOString() })
        .commitmentDate,
      'Winner announcement date must be no more than 30 days after the deadline',
    );
  });

  it('refuses taken slugs, unknown tokens, non-fixed pay and stray fields', () => {
    const errors = errorsOf(
      {
        title: 'A <b>title</b>',
        pocSocials: 'not a contact',
        isFndnPaying: true,
        skills: [{ skills: 'Design', subskills: ['React'] }],
      },
      {},
      { slugTaken: true, tokenAllowed: false },
    );
    assert.deepStrictEqual(Object.keys(errors).toSorted(), [
      'isFndnPaying',
      'pocSocials',
      'skills',
      'slug',
      'title',
      'token',
    ]);
    assert.strictEqual(
      errorsOf({ compensationType: 'range' }).compensationType,
      'Compensation type must be fixed',
    );
  });

  it('allows tracks only for a hackathon that exists, at its deadline', () => {
    assert.strictEqual(
      errorsOf({ type: 'hackathon', hackathonId: 'h1' }).type,
      'Hackathon is not allowed for now',
    );
    const deadline = new Date(NOW + 9 * DAY);
    assert.strictEqual(
      errorsOf(
        { type: 'hackathon', hackathonId: 'h1' },
        { hackathon: { id: 'h1', deadline } },
      ).deadline,
      'Hackathon deadline cannot be changed',
    );
  });
});

describe('regions', () => {
  const chapters = [{ region: 'India', code: 'IN' }];

  it('allows Global, chapters and countries no chapter covers', () => {
    assert.strictEqual(allowedRegion('global', chapters), 'Global');
    assert.strictEqual(allowedRegion('india', chapters), 'India');
    assert.strictEqual(allowedRegion('uk', chapters), 'United Kingdom');
    assert.isNull(allowedRegion('Atlantis', chapters));
  });

  it('keeps a chapter’s regional listing regional', () => {
    assert.isTrue(
      widensToGlobal({
        currentRegion: 'India',
        nextRegion: 'Global',
        hasChapter: true,
      }),
    );
    assert.isFalse(
      widensToGlobal({
        currentRegion: 'India',
        nextRegion: 'Global',
        hasChapter: false,
      }),
    );
  });
});

describe('normalizeTokenIcon', () => {
  it('proxies remote icons and keeps Earn’s own', () => {
    assert.strictEqual(normalizeTokenIcon(null), '/assets/dollar.svg');
    assert.strictEqual(
      normalizeTokenIcon('/assets/usdc.svg'),
      '/assets/usdc.svg',
    );
    assert.strictEqual(
      normalizeTokenIcon('http://example.com/a.png'),
      '/api/token-icon?url=https%3A%2F%2Fexample.com%2Fa.png',
    );
    assert.strictEqual(
      normalizeTokenIcon('https://superteam.fun/cdn/github/u/1'),
      '/api/token-icon?url=https%3A%2F%2Favatars.githubusercontent.com%2Fu%2F1',
    );
    assert.strictEqual(
      normalizeTokenIcon('javascript:alert(1)'),
      '/assets/dollar.svg',
    );
  });
});
