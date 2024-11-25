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

import { ogImageQuery } from '@/queries/og';

interface Props {
  title?: string;
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
  const _fallbackImages = [
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

  const fallbackImages = [
    '/assets/fallback/og/1.jpg',
    '/assets/fallback/og/2.jpg',
    '/assets/fallback/og/3.jpg',
    '/assets/fallback/og/4.jpg',
    '/assets/fallback/og/5.jpg',
    '/assets/fallback/og/6.jpg',
    '/assets/fallback/og/7.jpg',
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
  ...props
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
      {showTitle && (
        <Text
          pt={2}
          color="brand.slate.500"
          fontSize="sm"
          textOverflow="ellipsis"
          noOfLines={1}
        >
          {title || ogData?.title || ''}
        </Text>
      )}
    </div>
  );
};
