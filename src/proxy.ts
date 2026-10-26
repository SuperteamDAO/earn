import { NextResponse, type NextRequest } from 'next/server';

const isDev = process.env.NODE_ENV === 'development';
const isPreview = process.env.VERCEL_ENV === 'preview';

// Only these pages load Privy's SDK; every other page ships none of it.
const PRIVY_PAGES = ['/earn/signin', '/earn/wallet'];

// Pasted into the policy verbatim, so anything but a bare https origin (say
// 'unsafe-inline') would quietly widen it. Refuse to serve instead.
function origins(name: string, value: string | undefined): string[] {
  const list = (value ?? '').split(/[\s,]+/).filter(Boolean);
  for (const item of list) {
    const url = URL.parse(item);
    if (url?.protocol !== 'https:' || url.origin !== item) {
      throw new Error(`${name}: "${item}" is not an https origin`);
    }
  }
  return list;
}

// Privy's own origins, plus Earn's custom Privy domain.
const PRIVY_ORIGINS = [
  'https://auth.privy.io',
  'https://*.rpc.privy.systems',
  ...origins('PRIVY_CSP_ORIGINS', process.env.PRIVY_CSP_ORIGINS),
].join(' ');

// Earn's RPC, for wallet pages and sponsors paying from their own wallet.
const RPC_ORIGINS =
  'https://*.helius-rpc.com wss://mainnet.helius-rpc.com https://api.mainnet-beta.solana.com https://api.devnet.solana.com';

// KYC runs Sumsub's verification in a frame; like the Privy pages, those
// pages are documents with their own policy.
const KYC_PAGE = /^\/earn\/(kyc|grants\/[^/]+\/kyc)(\/|$)/;
const SUMSUB_ORIGINS = 'https://*.sumsub.com';
const SUMSUB_FRAME = '"https://in.sumsub.com" "https://api.sumsub.com"';

function permissionsPolicy(kyc: boolean): string {
  const media = kyc ? `(self ${SUMSUB_FRAME})` : '()';
  return [
    `camera=${media}`,
    `microphone=${media}`,
    `geolocation=${media}`,
    'payment=()',
    'usb=()',
    'browsing-topics=()',
  ].join(', ');
}

// Images: Earn's Cloudinary, Google and Airtable avatars and attachments.
const IMAGES =
  'https://res.cloudinary.com https://*.googleusercontent.com https://dl.airtable.com https://*.airtableusercontent.com https://www.googletagmanager.com';
// Embeds in listing descriptions and pages.
const EMBEDS =
  'https://www.youtube.com https://www.youtube-nocookie.com https://loom.com https://www.loom.com https://res.cloudinary.com https://airtable.com https://*.airtable.com https://challenges.cloudflare.com';
// Analytics (PostHog goes through /docs-keep on Earn's own origin), uploads
// and the like, which every page may reach.
const CONNECT =
  'https://www.google-analytics.com https://*.google-analytics.com https://api.cloudinary.com https://res.cloudinary.com https://ipapi.co wss://earn-vibe-production.up.railway.app';

interface Document {
  readonly privy: boolean;
  readonly kyc: boolean;
  // Signin's hidden frames (renew, sign-out) may be framed by Earn itself.
  readonly frameable: boolean;
}

function contentSecurityPolicy(nonce: string, page: Document): string {
  const frames = page.privy
    ? PRIVY_ORIGINS
    : `'self' ${EMBEDS}${page.kyc ? ` ${SUMSUB_ORIGINS}` : ''}`;
  return [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? ` 'unsafe-eval'` : ''}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob: ${IMAGES}`,
    `media-src 'self' blob: data: https://res.cloudinary.com`,
    `font-src 'self'`,
    `connect-src 'self' ${CONNECT} ${RPC_ORIGINS}${page.privy ? ` ${PRIVY_ORIGINS}` : ''}${page.kyc ? ` ${SUMSUB_ORIGINS}` : ''}`,
    `frame-src ${frames}`,
    `worker-src 'self' blob:`,
    `manifest-src 'self'`,
    `object-src 'none'`,
    `base-uri 'none'`,
    `form-action 'self'`,
    `frame-ancestors ${page.frameable ? `'self'` : page.kyc ? `'self' ${SUMSUB_ORIGINS}` : `'none'`}`,
    ...(isDev ? [] : ['upgrade-insecure-requests']),
  ].join('; ');
}

const startsWithPage = (pathname: string, page: string) =>
  pathname === page || pathname.startsWith(`${page}/`);

export function proxy(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const { pathname, searchParams } = request.nextUrl;
  const privy = PRIVY_PAGES.some((page) => startsWithPage(pathname, page));
  const kyc = KYC_PAGE.test(pathname);

  // A CSP belongs to a document, so a Privy or KYC page must load as its
  // own: a client-side hop into one would run it under another page's
  // policy. They answer no GET fetches but full navigations, and with no
  // payload Next loads them in full. `Sec-Fetch-Dest` comes from the
  // browser, so Next can't strip it the way it strips its RSC headers.
  if (
    (privy || kyc) &&
    request.method === 'GET' &&
    request.headers.get('sec-fetch-dest') === 'empty'
  ) {
    return new NextResponse(null, { status: 204 });
  }

  // Only sign-in's and the wallet's frames: the parameter given once and set
  // to 1, exactly as the page reads it.
  const once = (key: string) => {
    const values = searchParams.getAll(key);
    return values.length === 1 && values[0] === '1';
  };
  // Earn's sign-in dialog frames the form itself (`embed`), and the wallet
  // drawer frames the wallet page.
  const frameable =
    (startsWithPage(pathname, '/earn/signin') &&
      (once('renew') || once('sign-out') || once('embed'))) ||
    (startsWithPage(pathname, '/earn/wallet') && once('embed'));
  const csp = contentSecurityPolicy(nonce, { privy, kyc, frameable });

  // Next stamps the nonce from the request's CSP on its own scripts; pages
  // read `x-nonce` to hand it to Privy.
  const headers = new Headers(request.headers);
  headers.set('x-nonce', nonce);
  // Server components can't see their own URL; sign-in redirects read it
  // here (src/lib/request-path.ts). Set by the proxy, so never the client's.
  headers.set('x-earn-path', pathname + request.nextUrl.search);
  headers.set('content-security-policy', csp);

  const response = NextResponse.next({ request: { headers } });
  response.headers.set('content-security-policy', csp);
  response.headers.set('permissions-policy', permissionsPolicy(kyc));
  if (isPreview) response.headers.set('x-robots-tag', 'noindex');
  return response;
}

// Every document and route; static files and images skip it. Matched
// exactly: a looser pattern would leave some 404 page without a policy.
export const config = {
  matcher: ['/((?!_next/static/|_next/image/?$|assets/|fonts/).*)'],
};
