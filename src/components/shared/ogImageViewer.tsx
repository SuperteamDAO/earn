import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import React, { useCallback, useEffect, useState } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { ogImageQuery } from '@/queries/og';
import { cn } from '@/utils';

interface Props {
  title?: string;
  showTitle?: boolean;
  externalUrl?: string;
  imageUrl?: string;
  id?: string;
  type?: 'submission' | 'pow';
  className?: string;
}

const getRandomFallbackImage = (): string => {
  const fallbackImages = [
    '/assets/fallback/og/1.webp',
    '/assets/fallback/og/2.webp',
    '/assets/fallback/og/3.webp',
    '/assets/fallback/og/4.webp',
    '/assets/fallback/og/5.webp',
    '/assets/fallback/og/6.webp',
    '/assets/fallback/og/7.webp',
    '/assets/fallback/og/8.webp',
    '/assets/fallback/og/9.webp',
    '/assets/fallback/og/10.webp',
    '/assets/fallback/og/11.webp',
  ];

  const randomIndex = Math.floor(Math.random() * fallbackImages.length);
  return fallbackImages[randomIndex]!;
};

export const OgImageViewer = ({
  title,
  showTitle,
  externalUrl,
  imageUrl,
  type,
  id,
  className,
}: Props) => {
  const fallbackImage = getRandomFallbackImage();
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(
    imageUrl || null,
  );

  const { data: ogData, isLoading } = useQuery(ogImageQuery(externalUrl!));

  useEffect(() => {
    const updateOgImage = async () => {
      if (ogData?.images?.[0]?.url && type && id) {
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
        }
      } else if (!imageUrl && !externalUrl) {
        setCurrentImageUrl(fallbackImage);
      }
    };

    if (!currentImageUrl) {
      updateOgImage();
    } else if (currentImageUrl === 'error') {
      setCurrentImageUrl(fallbackImage);
    }
  }, [ogData, imageUrl, externalUrl, type, id, fallbackImage]);

  const handleImageError = useCallback(() => {
    setCurrentImageUrl(fallbackImage);
  }, [fallbackImage]);

  if (isLoading) {
    return <Skeleton className={className} />;
  }

  return (
    <div>
      <img
        className={cn('bg-center', className)}
        alt="OG Image"
        onError={handleImageError}
        src={currentImageUrl || fallbackImage}
      />
      {showTitle && (
        <p className="truncate pt-2 text-sm text-slate-500">
          {title || ogData?.title || ''}
        </p>
      )}
    </div>
  );
};
