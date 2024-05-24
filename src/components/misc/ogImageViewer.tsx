import {
  Image,
  type ImageProps,
  type ResponsiveValue,
  Skeleton,
} from '@chakra-ui/react';
import axios from 'axios';
import React, { useCallback, useEffect, useState } from 'react';
import type { Metadata } from 'unfurl.js/dist/types';

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

export const OgImageViewer: React.FC<Props> = ({
  externalUrl,
  imageUrl,
  type,
  id,
  ...props
}) => {
  const [ogImageUrl, setOgImageUrl] = useState<string | null>(imageUrl || null);
  const fallbackImage = getRandomFallbackImage();

  useEffect(() => {
    const fetchImage = async () => {
      if (!imageUrl && externalUrl) {
        try {
          const { data } = (await axios.post('/api/og/get', {
            url: externalUrl,
          })) as { data: Metadata };

          const ogImageURL = data.open_graph?.images?.[0]?.url;
          setOgImageUrl(ogImageURL || fallbackImage);

          if (type && id && ogImageURL) {
            await axios.post('/api/og/update', {
              type,
              url: ogImageURL,
              id,
            });
          }
        } catch (error) {
          setOgImageUrl(fallbackImage);
        }
      } else if (!imageUrl && !externalUrl) {
        setOgImageUrl(fallbackImage);
      }
    };

    fetchImage();
  }, [externalUrl, imageUrl]);

  const handleImageError = useCallback(() => {
    setOgImageUrl(fallbackImage);
  }, [fallbackImage]);

  return (
    <div>
      {ogImageUrl ? (
        <Image
          bgPosition={'center'}
          alt="OG Image"
          onError={handleImageError}
          src={ogImageUrl}
          {...props}
        />
      ) : (
        <Skeleton {...props} />
      )}
    </div>
  );
};
