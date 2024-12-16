import React from 'react';

import { ASSET_URL } from '@/constants/ASSET_URL';

interface ExternalImageProps {
  className?: string;
  src: string;
  alt: string | undefined;
  style?: React.CSSProperties;
  loading?: 'lazy' | 'eager';
  decoding?: 'async' | 'sync';
  transformations?: Record<string, string | number>;
}

const buildCloudinaryURL = (
  src: string,
  transformations?: Record<string, string | number>,
): string => {
  const baseUrl = ASSET_URL.replace(/\/$/, '');

  const transformationString = transformations
    ? Object.entries(transformations)
        .map(([key, value]) => `${key}_${value}`)
        .join(',')
    : '';

  const urlParts = [baseUrl, transformationString, src].filter(Boolean);

  return urlParts.join('/');
};

export const ExternalImage = ({
  className,
  src,
  alt,
  style,
  loading = 'lazy',
  decoding = 'async',
  transformations,
}: ExternalImageProps) => {
  const cloudinaryUrl = buildCloudinaryURL(src, transformations);

  return (
    <img
      src={cloudinaryUrl}
      alt={alt}
      className={className}
      style={style}
      loading={loading}
      referrerPolicy="no-referrer"
      decoding={decoding}
    />
  );
};
