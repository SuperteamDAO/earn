import React from 'react';

import { ASSET_URL } from '@/constants/ASSET_URL';

interface ExternalImageProps {
  className?: string;
  src: string;
  alt: string | undefined;
  style?: React.CSSProperties;
  loading?: 'lazy' | 'eager';
  decoding?: 'async' | 'sync';
  fetchPriority?: 'high' | 'low' | 'auto';
  transformations?: Record<string, string | number>;
  /** Cloudinary widths to emit as a responsive srcSet (overrides `w`). */
  widths?: number[];
  sizes?: string;
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
  fetchPriority,
  transformations,
  widths,
  sizes,
  width,
  height,
}: ExternalImageProps) => {
  const cloudinaryUrl = buildCloudinaryURL(src, transformations);
  const srcSet = widths
    ?.map((w) => `${buildCloudinaryURL(src, { ...transformations, w })} ${w}w`)
    .join(', ');

  return (
    <img
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      src={cloudinaryUrl}
      alt={alt}
      className={className}
      style={style}
      loading={loading}
      fetchPriority={fetchPriority}
      referrerPolicy="no-referrer"
      decoding={decoding}
      width={width}
      height={height}
    />
  );
};
