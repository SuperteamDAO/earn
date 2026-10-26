// Having Privy vouch for a session from a public page: /earn/signin/?renew=1 does it
// in a hidden frame, has the server reissue Earn's own session cookie, and
// posts one of these back (see src/app/session-renewal.ts). Shared by both
// sides.

export const RENEWAL = 'earn:renewal';

export interface RenewalMessage {
  readonly type: typeof RENEWAL;
  // renewed: Privy vouched and Earn's session was reissued.
  // signed-out: Privy has no session; every session cookie has been cleared.
  // failed: Privy couldn't be reached or refused for now; nothing changed.
  readonly outcome: 'renewed' | 'signed-out' | 'failed';
}

// Pages have Privy vouch again once Earn's session is a day old. Each
// time moves both sessions' 30 days on, and catches a session Privy has
// ended within a day of use; writes rely on Earn's own cookie, so nothing
// needs it sooner. Each time also loads Privy's SDK in a hidden frame (about
// 480 KB compressed), so not on every visit.
export const CONFIRM_MS = 24 * 60 * 60_000;
// When one is due as a page opens, it waits this long, so the page's own
// loading goes first.
export const SETTLE_MS = 5_000;
// Retries back off from a minute to a quarter of an hour.
const RETRY_MS = 60_000;
const RETRY_MAX_MS = 15 * 60_000;

// How long until Privy should vouch again for a session it last vouched for
// at `confirmedAt` (null: never, for Earn's own cookie), both read from
// the server's clock so the visitor's can't skew it.
export const confirmDelay = (confirmedAt: number | null, now: number) =>
  confirmedAt === null ? 0 : Math.max(confirmedAt + CONFIRM_MS - now, 0);

// How long to wait before the nth retry (1, 2, 3…).
export const retryDelay = (attempt: number) =>
  Math.min(RETRY_MS * 2 ** (attempt - 1), RETRY_MAX_MS);
