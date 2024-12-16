import React from 'react';

interface LocalImageProps {
  className?: string;
  src: string;
  alt: string;
  style?: React.CSSProperties;
  loading?: 'lazy' | 'eager';
  decoding?: 'async' | 'sync';
  onError?: (event: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

export const LocalImage = ({
  className,
  src,
  alt,
  style,
  loading = 'lazy',
  decoding = 'async',
  onError,
}: LocalImageProps) => {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      loading={loading}
      referrerPolicy="no-referrer"
      decoding={decoding}
      onError={onError}
    />
  );
};
