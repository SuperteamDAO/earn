import IsoDomPurify from 'isomorphic-dompurify';

export function domPurify(dirty: string | Node, cfg?: IsoDomPurify.Config) {
  return IsoDomPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['a', 'p', 'br', 'strong', 'em'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ...cfg,
  });
}
