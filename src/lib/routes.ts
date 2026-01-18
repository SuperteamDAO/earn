export const ROUTE_PREFIX = '/earn';

export function route(path: string): string {
  if (
    path.startsWith('/api') ||
    path.startsWith('http') ||
    path.startsWith('#')
  )
    return path;
  return `${ROUTE_PREFIX}${path.startsWith('/') ? path : '/' + path}`;
}

export function isEarnPath(pathname: string, check: string): boolean {
  return pathname.startsWith(`${ROUTE_PREFIX}${check}`);
}
