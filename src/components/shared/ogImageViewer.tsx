'use client';

import { useCallback, useEffect, useState } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { useViewer } from '@/lib/viewer';
import { cn } from '@/utils/cn';

import { LocalImage } from '../ui/local-image';

interface Props {
  title?: string;
  showTitle?: boolean;
  externalUrl?: string;
  imageUrl?: string;
  id?: string;
  type?: 'submission' | 'pow';
  className?: string;
  isWinnersAnnounced?: boolean;
}

type OgImageMetadata = {
  title?: string;
  images?: Array<{ url: string }>;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

// /api/og/get's `result`: Open Graph data, or 'error'.
function ogResultOf(value: unknown): OgImageMetadata | 'error' {
  if (!isRecord(value)) return 'error';
  const result = value.result;
  if (!isRecord(result)) return 'error';
  const images = Array.isArray(result.images)
    ? result.images.flatMap((image: unknown) =>
        isRecord(image) && typeof image.url === 'string'
          ? [{ url: image.url }]
          : [],
      )
    : undefined;
  return {
    title: typeof result.title === 'string' ? result.title : undefined,
    images,
  };
}

// Earn's ogImageQuery, without react-query: a signed-in viewer stores the
// image on the record (`/api/og/update/`); otherwise, or when that's
// refused, it's read live (`/api/og/get/`). Plain fetch: a refused update
// must not send them to sign in.
async function fetchOgImage(
  url: string,
  record: { type: 'submission' | 'pow'; id: string } | null,
  signal: AbortSignal,
): Promise<OgImageMetadata | 'error'> {
  if (record) {
    const response = await fetch('/api/og/update/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(record),
      signal,
    }).catch(() => null);
    if (response?.ok) {
      const data: unknown = await response.json().catch(() => null);
      if (isRecord(data) && typeof data.imageUrl === 'string') {
        return data.imageUrl === 'error'
          ? 'error'
          : { images: [{ url: data.imageUrl }] };
      }
    }
  }
  const response = await fetch(
    `/api/og/get/?${new URLSearchParams({ url }).toString()}`,
    { signal: AbortSignal.any([signal, AbortSignal.timeout(5000)]) },
  );
  if (!response.ok) throw new Error(`OG lookup failed: ${response.status}`);
  return ogResultOf(await response.json());
}

const fallbackImageCache = new Map<number, string>();

const getRandomFallbackImage = (): string => {
  const randomNumber = Math.floor(Math.random() * 11) + 1;
  const cached = fallbackImageCache.get(randomNumber);
  if (cached) return cached;
  const image = `/assets/fallback/og/${randomNumber}.webp`;
  fallbackImageCache.set(randomNumber, image);
  return image;
};

export const OgImageViewer = ({
  title,
  showTitle,
  externalUrl,
  imageUrl,
  type,
  id,
  className,
  isWinnersAnnounced = true,
}: Props) => {
  const cachedImageUrl = imageUrl === 'error' ? null : imageUrl;
  const [fallbackImage] = useState(getRandomFallbackImage());
  const [imageFailed, setImageFailed] = useState(false);

  const signedIn = !!useViewer();
  const enabled = !cachedImageUrl && isWinnersAnnounced && !!externalUrl;
  // Undefined until the lookup settles; null when it failed.
  const [ogData, setOgData] = useState<OgImageMetadata | 'error' | null>();

  useEffect(() => {
    if (!enabled || !externalUrl) return undefined;
    const controller = new AbortController();
    const record = type && id && signedIn ? { type, id } : null;
    const attempt = () => fetchOgImage(externalUrl, record, controller.signal);
    // One retry, as Earn's query had.
    attempt()
      .catch(() => attempt())
      .then(
        (data) => {
          if (!controller.signal.aborted) setOgData(data);
        },
        () => {
          if (!controller.signal.aborted) setOgData(null);
        },
      );
    return () => controller.abort();
  }, [enabled, externalUrl, type, id, signedIn]);

  const isLoading = enabled && ogData === undefined;
  const currentImageUrl = imageFailed
    ? fallbackImage
    : cachedImageUrl ||
      (ogData && ogData !== 'error' ? ogData.images?.[0]?.url : null) ||
      null;

  const handleImageError = useCallback(() => {
    setImageFailed(true);
  }, []);

  if (isLoading) {
    return <Skeleton className={className} />;
  }

  return (
    <div>
      <LocalImage
        className={cn('bg-center', className)}
        alt="OG Image"
        onError={handleImageError}
        src={currentImageUrl || fallbackImage}
      />
      {showTitle && (
        <p className="truncate pt-2 text-sm text-slate-500">
          {title || (ogData && ogData !== 'error' ? ogData.title || '' : '')}
        </p>
      )}
    </div>
  );
};
