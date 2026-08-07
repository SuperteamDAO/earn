export type OgImageTarget = 'submission' | 'pow';

export interface OgImageUpdateRequest {
  id: string;
  type: OgImageTarget;
}

export const parseOgImageUpdateRequest = (
  body: unknown,
): OgImageUpdateRequest | null => {
  if (!body || typeof body !== 'object') return null;

  const { id, type } = body as Record<string, unknown>;
  if (
    (type !== 'submission' && type !== 'pow') ||
    typeof id !== 'string' ||
    id.trim().length === 0 ||
    id.length > 64
  ) {
    return null;
  }

  // Deliberately return only record identity. Image URLs are derived server-side.
  return { id, type };
};

export const getOgImageValue = (
  result: 'error' | { images?: Array<{ url?: string }> },
): string =>
  result === 'error' ? 'error' : result.images?.[0]?.url || 'error';
