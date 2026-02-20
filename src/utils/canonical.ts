const addTrailingSlash = (pathname: string): string => {
  const normalizedPath = pathname.replace(/\/{2,}/g, '/');
  if (normalizedPath === '/') return '/';
  return normalizedPath.endsWith('/') ? normalizedPath : `${normalizedPath}/`;
};

export const normalizeCanonicalUrl = (url: string): string => {
  const trimmedUrl = url.trim();
  if (!trimmedUrl) return trimmedUrl;

  try {
    const parsedUrl = new URL(trimmedUrl);
    parsedUrl.search = '';
    parsedUrl.hash = '';
    parsedUrl.pathname = addTrailingSlash(parsedUrl.pathname);
    return parsedUrl.toString();
  } catch {
    return trimmedUrl;
  }
};

export const canonicalFromPath = (
  path: string,
  baseUrl = 'https://superteam.fun',
): string => {
  const parsedUrl = new URL(path || '/', baseUrl);
  parsedUrl.search = '';
  parsedUrl.hash = '';
  parsedUrl.pathname = addTrailingSlash(parsedUrl.pathname);
  return parsedUrl.toString();
};
