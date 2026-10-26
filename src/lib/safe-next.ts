const BASE = 'https://earn.invalid';
const HOME = '/earn/';
const SIGN_IN = '/earn/signin';

// Parsed the way a browser would, so `?next=` can only point at a path on
// this site. `location.replace` reads `//host` as another origin, so reject it.
export function safeNext(next: string | null | undefined): string {
  if (!next) return HOME;
  try {
    const url = new URL(next, BASE);
    if (url.origin !== BASE || url.pathname.startsWith('//')) return HOME;
    // Landing back on sign-in would look like a failed sign-in.
    if (url.pathname === SIGN_IN || url.pathname.startsWith(`${SIGN_IN}/`)) {
      return HOME;
    }
    return url.pathname + url.search + url.hash;
  } catch {
    return HOME;
  }
}

// Where a signed-out visitor goes to sign in, coming back to `next`.
export const signInHref = (next?: string | null) =>
  next ? `${SIGN_IN}/?next=${encodeURIComponent(next)}` : `${SIGN_IN}/`;
