import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
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
      `/earn/assets/fallback/og/${randomNumber}.webp`,
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
  const [fallbackImage] = useState(getRandomFallbackImage());
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(
    imageUrl || null,
  );
  const [isUpdating, setIsUpdating] = useState(false);

  const {
    data: ogData,
    isLoading,
    error,
  } = useQuery({
    ...ogImageQuery(externalUrl!),
    retry: 1,
    enabled:
      !imageUrl && isWinnersAnnounced && !!externalUrl && imageUrl !== 'error',
  });

  useEffect(() => {
    if (error && !isUpdating) {
      const handleError = async () => {
        setIsUpdating(true);
        try {
          if (type && id) {
            await api.post('/api/og/update', {
              type,
              url: 'error',
              id,
            });
          }
          setCurrentImageUrl(fallbackImage);
        } finally {
          setIsUpdating(false);
        }
      };
      handleError();
    }
  }, [error, type, id, fallbackImage]);

  useEffect(() => {
    if (isUpdating || currentImageUrl || imageUrl === 'error') return;

    const updateOgImage = async () => {
      setIsUpdating(true);
      try {
        if (ogData === 'error') {
          if (type && id) {
            await api.post('/api/og/update', {
              type,
              url: 'error',
              id,
            });
          }
          setCurrentImageUrl(fallbackImage);
          return;
        }

        const ogImageUrl = ogData?.images?.[0]?.url;
        if (ogImageUrl) {
          if (type && id) {
            await api.post('/api/og/update', {
              type,
              url: ogImageUrl,
              id,
            });
          }
          setCurrentImageUrl(ogImageUrl);
        } else {
          setCurrentImageUrl(fallbackImage);
        }
      } catch (error) {
        setCurrentImageUrl(fallbackImage);
      } finally {
        setIsUpdating(false);
      }
    };

    if (ogData) {
      updateOgImage();
    }
  }, [ogData, type, id, fallbackImage, isUpdating, currentImageUrl, imageUrl]);

  const handleImageError = useCallback(() => {
    if (isUpdating) return;

    const updateImage = async () => {
      setIsUpdating(true);
      try {
        if (type && id) {
          await api.post('/api/og/update', {
            type,
            url: 'error',
            id,
          });
        }
        setCurrentImageUrl(fallbackImage);
      } finally {
        setIsUpdating(false);
      }
    };
    updateImage();
  }, [fallbackImage, type, id, isUpdating]);

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
