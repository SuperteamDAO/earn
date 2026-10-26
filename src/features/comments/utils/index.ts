import type { Comment } from '../types';

export function formatFromNow(now: string) {
  return now
    .replace('a few seconds', '1s')
    .replace('a minute', '1m')
    .replace(' minutes', 'm')
    .replace('an hour', '1h')
    .replace(' hours', 'h')
    .replace('a day', '1d')
    .replace(' days', 'd')
    .replace('a month', '1M')
    .replace(' months', 'M')
    .replace('a year', '1y')
    .replace(' years', 'y');
}

export function sortComments(comments: ReadonlyArray<Comment>): Comment[] {
  const timeSorted = comments.toSorted(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const sortedComments = timeSorted.toSorted((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });
  return sortedComments;
}
