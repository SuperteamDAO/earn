import {
  Image,
  type ImageProps,
  type ResponsiveValue,
  Skeleton,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import React, { useCallback, useEffect, useState } from 'react';

import { ogImageQuery } from '@/queries/og-image';

interface Props {
  externalUrl?: string;
  imageUrl?: string;
  w?: ResponsiveValue<string | number>;
  h?: ResponsiveValue<string | number>;
  objectFit?: ImageProps['objectFit'];
  borderTopRadius?: string | number;
  borderRadius?: string | number;
  aspectRatio?: ResponsiveValue<string | number>;
  id?: string;
  type?: 'submission' | 'pow';
}

const getRandomFallbackImage = (): string => {
  const fallbackImages = [
    '/assets/fallback/og/1.png',
    '/assets/fallback/og/2.png',
    '/assets/fallback/og/3.png',
    '/assets/fallback/og/4.png',
    '/assets/fallback/og/5.png',
    '/assets/fallback/og/6.png',
    '/assets/fallback/og/7.png',
    '/assets/fallback/og/8.png',
    '/assets/fallback/og/9.png',
    '/assets/fallback/og/10.png',
    '/assets/fallback/og/11.png',
  ];

  const randomIndex = Math.floor(Math.random() * fallbackImages.length);
  return fallbackImages[randomIndex]!;
};

export const OgImageViewer = ({
  externalUrl,
  imageUrl,
  type,
  id,
  ...props
}: Props) => {
  const fallbackImage = getRandomFallbackImage();
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(
    imageUrl || null,
  );

  const { data: ogImageUrl, isLoading } = useQuery(ogImageQuery(externalUrl!));

  useEffect(() => {
    if (ogImageUrl) {
      setCurrentImageUrl(ogImageUrl);
      if (type && id) {
        axios.post('/api/og/update', {
          type,
          url: ogImageUrl,
          id,
        });
      }
    } else if (!imageUrl && !externalUrl) {
      setCurrentImageUrl(fallbackImage);
    }
  }, [ogImageUrl, imageUrl, externalUrl, type, id]);

  const handleImageError = useCallback(() => {
    setCurrentImageUrl(fallbackImage);
  }, [fallbackImage]);

  if (isLoading) {
    return <Skeleton {...props} />;
  }

  return (
    <div>
      <Image
        bgPosition={'center'}
        alt="OG Image"
        onError={handleImageError}
        src={currentImageUrl || fallbackImage}
        {...props}
      />
    </div>
  );
};
