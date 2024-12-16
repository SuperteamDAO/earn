import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import React, { useCallback, useEffect, useState } from 'react';

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
    const handleError = async () => {
      if (type && id && !isUpdating) {
        setIsUpdating(true);
        try {
          await axios.post('/api/og/update', {
            type,
            url: 'error',
            id,
          });
        } finally {
          setIsUpdating(false);
          setCurrentImageUrl(fallbackImage);
        }
      }
    };

    if (error) {
      handleError();
    }
  }, [error, type, id, isUpdating, fallbackImage]);

  useEffect(() => {
    const updateOgImage = async () => {
      if (isUpdating) return;

      if (ogData === 'error') {
        if (type && id) {
          setIsUpdating(true);
          try {
            await axios.post('/api/og/update', {
              type,
              url: 'error',
              id,
            });
          } finally {
            setIsUpdating(false);
          }
        }
        setCurrentImageUrl(fallbackImage);
        return;
      }

      if (ogData?.images?.[0]?.url && type && id) {
        setIsUpdating(true);
        try {
          await axios.post('/api/og/update', {
            type,
            url: ogData.images[0].url,
            id,
          });
          setCurrentImageUrl(ogData.images[0].url);
        } catch (error) {
          await axios.post('/api/og/update', {
            type,
            url: 'error',
            id,
          });
          setCurrentImageUrl(fallbackImage);
        } finally {
          setIsUpdating(false);
        }
      }
    };

    if (!currentImageUrl && imageUrl !== 'error') {
      updateOgImage();
    }
  }, [ogData, type, id, fallbackImage, isUpdating, imageUrl]);

  const handleImageError = useCallback(() => {
    if (type && id && !isUpdating) {
      setIsUpdating(true);
      axios
        .post('/api/og/update', {
          type,
          url: 'error',
          id,
        })
        .finally(() => {
          setIsUpdating(false);
          setCurrentImageUrl(fallbackImage);
        });
    } else {
      setCurrentImageUrl(fallbackImage);
    }
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
