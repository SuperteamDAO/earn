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
  width?: number | string;
  height?: number | string;
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

  if (!transformationString) {
    return [baseUrl, src].filter(Boolean).join('/');
  }

  const uploadMarker = '/upload/';
  const uploadMarkerIndex = baseUrl.indexOf(uploadMarker);

  if (uploadMarkerIndex === -1) {
    return [baseUrl, transformationString, src].filter(Boolean).join('/');
  }

  const transformationIndex = uploadMarkerIndex + uploadMarker.length;
  const cloudinaryRoot = baseUrl.slice(0, transformationIndex - 1);
  const assetPath = baseUrl.slice(transformationIndex);

  return [cloudinaryRoot, transformationString, assetPath, src]
    .filter(Boolean)
    .join('/');
};

export const ExternalImage = ({
  className,
  src,
  alt,
  style,
  loading = 'lazy',
  decoding = 'async',
  transformations,
  width,
  height,
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
      width={width}
      height={height}
    />
  );
};
