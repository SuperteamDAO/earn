import {
  Image,
  type ImageProps,
  type ResponsiveValue,
  Skeleton,
  Text,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import React, { useCallback, useEffect, useState } from 'react';

import { ogImageQuery } from '@/queries/og-image';

interface Props {
  showTitle?: boolean;
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
  showTitle,
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

  const { data: ogData, isLoading } = useQuery(ogImageQuery(externalUrl!));

  useEffect(() => {
    if (ogData?.images?.[0]?.url) {
      setCurrentImageUrl(ogData.images?.[0]?.url);
      if (type && id) {
        axios.post('/api/og/update', {
          type,
          url: ogData.images?.[0]?.url,
          id,
        });
      }
    } else if (!imageUrl && !externalUrl) {
      setCurrentImageUrl(fallbackImage);
    }
  }, [ogData, imageUrl, externalUrl, type, id]);

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
      {showTitle && !!ogData && (
        <Text
          pt={2}
          color="brand.slate.500"
          fontSize="sm"
          textOverflow="ellipsis"
          noOfLines={1}
        >
          {ogData?.title}
        </Text>
      )}
    </div>
  );
};
