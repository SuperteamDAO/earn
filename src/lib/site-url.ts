export function isProductionEnv(): boolean {
  return (
    process.env.VERCEL_ENV === 'production' ||
    process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'
  );
}

export function getSiteUrl(): string {
  const rawUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.SITE_URL ??
    process.env.VERCEL_URL ??
    process.env.NEXT_PUBLIC_VERCEL_URL ??
    'https://superteam.fun';

  const withProtocol = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;

  return withProtocol.replace(/\/+$/, '');
}
