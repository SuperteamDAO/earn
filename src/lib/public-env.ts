// The settings client code may read: Next inlines `NEXT_PUBLIC_*` into the
// bundle at build time, so they're public by definition. Server code reads
// AppConfig instead.
export const publicEnv = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  vercelEnv: process.env.NEXT_PUBLIC_VERCEL_ENV,
  // Host of Earn's RPC, without the scheme.
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL,
  rpcWsUrl: process.env.NEXT_PUBLIC_RPC_WS_URL,
  paymentCluster: process.env.NEXT_PUBLIC_PAYMENT_CLUSTER,
  gaTrackingId: process.env.NEXT_PUBLIC_GA_TRACKING_ID,
  posthogKey: process.env.NEXT_PUBLIC_POSTHOG_KEY,
  posthogHost: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  feePayer: process.env.NEXT_PUBLIC_FEEPAYER,
} as const;
