// Single base URL for entire site
export const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://superteam.fun';

export const getCanonicalUrl = (path: string) => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_URL}${cleanPath}`;
};
