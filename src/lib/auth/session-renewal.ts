import { RENEWAL } from '@/lib/renewal';

// Only Privy's SDK can renew Privy's session, and public pages don't load
// it, so they ask /earn/signin to, in a hidden frame: a document of its own, under
// the CSP that lets Privy run. It then has the server reissue Earn's own
// session cookie. The page itself never leaves or reloads.

export interface Renewal {
  // renewed: Privy vouched and Earn's session cookie was reissued.
  // signed-out: Privy has no session; /earn/signin has cleared the cookies.
  // failed: no answer in time, or Privy refused for now. Nothing changed.
  readonly kind: 'renewed' | 'signed-out' | 'failed';
}

const LIMIT_MS = 15_000;

// Every tab of this browser shares Privy's refresh token. Two frames that
// start together (tabs restored at once, say) would each trade the same
// token, and should Privy refuse the second as reused, that frame would
// sign the visitor out everywhere. So these frames take turns, and signing
// out waits its turn too: a renewal finishing after it would sign them back
// in. Browsers without Web Locks go ahead unordered.
const LOCK = 'earn:privy';

function exclusively<A>(task: () => Promise<A>, timedOut: A) {
  if (!('locks' in navigator)) return task();
  return navigator.locks
    .request(LOCK, { signal: AbortSignal.timeout(LIMIT_MS) }, task)
    .catch(() => timedOut);
}

// When some tab last renewed. One that waited its turn behind a renewal
// this recent takes that one's word: the cookies are the same. Open tabs
// keeping a session going share one schedule this way (see SessionKeeper).
const RENEWED_AT = 'earn:renewed-at';
const RECENT_MS = 60_000;

function renewedWithin(window: number): boolean {
  try {
    const at = Number(localStorage.getItem(RENEWED_AT));
    return Math.abs(Date.now() - at) < window;
  } catch {
    return false;
  }
}

function forgetRenewal() {
  try {
    localStorage.removeItem(RENEWED_AT);
  } catch {
    // Without storage there's nothing to forget.
  }
}

const nothing = () => {};

// For Privy's own pages, /earn/signin and /earn/wallet, whose SDK trades the refresh
// token as it starts: waits out any renewal or sign-out under way in another
// tab, then holds the turn until `done` (once Privy has started), a while at
// most. After waiting too long it goes ahead anyway, unordered.
export function takeTurn(): {
  readonly turn: Promise<() => void>;
  readonly cancel: () => void;
} {
  let done = nothing;
  const finished = new Promise<void>((resolve) => {
    done = resolve;
  });
  if (!('locks' in navigator)) {
    return { turn: Promise.resolve(done), cancel: done };
  }
  const controller = new AbortController();
  const waiting = setTimeout(() => controller.abort(), LIMIT_MS);
  const turn = new Promise<() => void>((start) => {
    navigator.locks
      .request(LOCK, { signal: controller.signal }, () => {
        clearTimeout(waiting);
        start(done);
        return Promise.race([
          finished,
          new Promise<void>((resolve) => setTimeout(resolve, LIMIT_MS)),
        ]);
      })
      .catch(() => start(done));
  });
  return {
    turn,
    cancel: () => {
      clearTimeout(waiting);
      controller.abort();
      done();
    },
  };
}

// Signs out in turn with renewals, so none finishes after it and signs the
// visitor back in. True once the session has ended.
export const signingOut = (task: () => Promise<boolean>) =>
  exclusively(() => {
    forgetRenewal();
    return task();
  }, false);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

function renewalOf(data: unknown): Renewal | null {
  if (!isRecord(data) || data.type !== RENEWAL) return null;
  return {
    kind:
      data.outcome === 'renewed' || data.outcome === 'signed-out'
        ? data.outcome
        : 'failed',
  };
}

function inFrame(): Promise<Renewal> {
  return new Promise<Renewal>((resolve) => {
    const frame = document.createElement('iframe');
    frame.src = '/earn/signin/?renew=1';
    frame.hidden = true;
    frame.tabIndex = -1;
    frame.setAttribute('aria-hidden', 'true');

    const finish = (renewal: Renewal) => {
      window.removeEventListener('message', onMessage);
      clearTimeout(timer);
      frame.remove();
      resolve(renewal);
    };
    const onMessage = (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== frame.contentWindow
      ) {
        return;
      }
      const renewal = renewalOf(event.data);
      if (renewal) finish(renewal);
    };
    const timer = setTimeout(() => finish({ kind: 'failed' }), LIMIT_MS);
    window.addEventListener('message', onMessage);
    document.body.append(frame);
  });
}

// One renewal at a time, however many parts of the page ask.
let pending: Promise<Renewal> | null = null;

// `fresh`: how recent another tab's renewal may be and still stand for this
// one.
export function renewSession(fresh = RECENT_MS): Promise<Renewal> {
  pending ??= exclusively<Renewal>(
    async () => {
      if (renewedWithin(fresh)) return { kind: 'renewed' };
      const renewal = await inFrame();
      if (renewal.kind === 'renewed') {
        try {
          localStorage.setItem(RENEWED_AT, String(Date.now()));
        } catch {
          // Other tabs just renew for themselves.
        }
      } else if (renewal.kind === 'signed-out') {
        forgetRenewal();
      }
      return renewal;
    },
    { kind: 'failed' },
  ).finally(() => {
    pending = null;
  });
  return pending;
}
