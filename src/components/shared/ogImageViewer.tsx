import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { ogImageQuery } from '@/queries/og';
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

const fallbackImageCache = new Map<number, string>();

const getRandomFallbackImage = (): string => {
  const randomNumber = Math.floor(Math.random() * 11) + 1;
  if (!fallbackImageCache.has(randomNumber)) {
    fallbackImageCache.set(
      randomNumber,
      `/assets/fallback/og/${randomNumber}.webp`,
    );
  }
  return fallbackImageCache.get(randomNumber)!;
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
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(
    cachedImageUrl || null,
  );

  const {
    data: ogData,
    isLoading,
    error,
  } = useQuery({
    ...ogImageQuery(externalUrl!, type, id),
    retry: 1,
    enabled: !cachedImageUrl && isWinnersAnnounced && !!externalUrl,
  });

  useEffect(() => {
    if (error) setCurrentImageUrl(fallbackImage);
  }, [error, fallbackImage]);

  useEffect(() => {
    if (!ogData || currentImageUrl) return;

    if (ogData === 'error') {
      setCurrentImageUrl(fallbackImage);
      return;
    }

    setCurrentImageUrl(ogData.images?.[0]?.url || fallbackImage);
  }, [ogData, fallbackImage, currentImageUrl]);

  const handleImageError = useCallback(() => {
    setCurrentImageUrl(fallbackImage);
  }, [fallbackImage]);

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
          {title || (typeof ogData !== 'string' ? ogData?.title || '' : '')}
        </p>
      )}
    </div>
  );
};
