import type { ImageProps, ResponsiveValue } from '@chakra-ui/react';
import { Image, Skeleton } from '@chakra-ui/react';
import axios from 'axios';
import React, { useCallback, useEffect, useState } from 'react';
import type { Metadata } from 'unfurl.js/dist/types';

interface Props {
  externalUrl: string;
  w?: ResponsiveValue<string | number>;
  h?: ResponsiveValue<string | number>;
  objectFit?: ImageProps['objectFit'];
  borderTopRadius?: string | number;
  borderRadius?: string | number;
}

const getRandomFallbackImage = (): string => {
  const fallbackImages = [
    '/assets/fallback/og1.jpeg',
    '/assets/fallback/og2.jpeg',
    '/assets/fallback/og3.jpeg',
  ];

  const randomIndex = Math.floor(Math.random() * fallbackImages.length);
  return fallbackImages[randomIndex]!;
};

const OgImageViewer: React.FC<Props> = ({ externalUrl, ...props }) => {
  const [ogImageUrl, setOgImageUrl] = useState<string | null>(null);
  const fallbackImage = getRandomFallbackImage();

  useEffect(() => {
    const fetchImage = async () => {
      if (externalUrl) {
        try {
          const { data } = (await axios.post('/api/og', {
            url: externalUrl,
          })) as { data: Metadata };

          const ogImage = data.open_graph?.images?.[0]?.url;
          setOgImageUrl(ogImage || fallbackImage);
        } catch (error) {
          setOgImageUrl(fallbackImage);
        }
      } else {
        setOgImageUrl(fallbackImage);
      }
    };

    fetchImage();
  }, [externalUrl]);

  const handleImageError = useCallback(() => {
    setOgImageUrl(fallbackImage);
  }, [fallbackImage]);

  return (
    <div>
      {ogImageUrl ? (
        <Image
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

export default OgImageViewer;
