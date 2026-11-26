import { isBlockedDisposableEmail } from './disposableEmail';

type KnownAccountAbuseField =
  | 'email_domain'
  | 'email_local_part'
  | 'username'
  | 'name'
  | 'twitter'
  | 'telegram'
  | 'discord';

export type KnownAccountAbuseMatch = {
  field: KnownAccountAbuseField;
  rationale: string;
};

export type KnownAccountAbuseProfile = {
  email?: unknown;
  username?: unknown;
  firstName?: unknown;
  lastName?: unknown;
  twitter?: unknown;
  telegram?: unknown;
  discord?: unknown;
};

const BLOCKED_USERNAMES = new Set(['yuworks1', 'yuworks2']);
const BLOCKED_TWITTER_HANDLES = new Set(['yuworks1']);
const BLOCKED_TELEGRAM_HANDLES = new Set(['yuworks', 'yuworks1']);
const BLOCKED_DISCORD_HANDLES = new Set(['yuworks1']);

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function normalizeSocialHandle(value: unknown): string {
  const normalizedValue = normalizeText(value);
  if (!normalizedValue) return '';

  const withoutQuery = normalizedValue.split(/[?#]/, 1)[0] ?? '';
  const pathSegments = withoutQuery
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/^@/, '')
    .replace(/\/+$/, '')
    .split('/');

  return (pathSegments.at(-1) ?? '').replace(/^@/, '');
}

/**
 * Incident-specific denylist for the account-farming cluster. Keep these
 * signals narrow: broad patterns would create unacceptable false positives.
 */
export function matchKnownAccountAbuse(
  profile: KnownAccountAbuseProfile,
): KnownAccountAbuseMatch | null {
  const email = normalizeText(profile.email);
  if (email && isBlockedDisposableEmail(email)) {
    return {
      field: 'email_domain',
      rationale: 'Known abusive or disposable email domain',
    };
  }

  const emailLocalPart = email.split('@', 1)[0] ?? '';
  if (emailLocalPart.startsWith('yuwork')) {
    return {
      field: 'email_local_part',
      rationale: 'Known abusive email identity',
    };
  }

  const username = normalizeText(profile.username).replace(/^@/, '');
  if (BLOCKED_USERNAMES.has(username)) {
    return { field: 'username', rationale: 'Known abusive username' };
  }

  const firstName = normalizeText(profile.firstName);
  const lastName = normalizeText(profile.lastName);
  if (firstName === 'yu' && lastName === 'w') {
    return { field: 'name', rationale: 'Known abusive profile identity' };
  }

  if (BLOCKED_TWITTER_HANDLES.has(normalizeSocialHandle(profile.twitter))) {
    return { field: 'twitter', rationale: 'Known abusive X account' };
  }

  if (BLOCKED_TELEGRAM_HANDLES.has(normalizeSocialHandle(profile.telegram))) {
    return { field: 'telegram', rationale: 'Known abusive Telegram account' };
  }

  if (BLOCKED_DISCORD_HANDLES.has(normalizeSocialHandle(profile.discord))) {
    return { field: 'discord', rationale: 'Known abusive Discord account' };
  }

  return null;
}
