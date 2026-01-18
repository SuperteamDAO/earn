'use client';

import { useEffect, useRef, useState } from 'react';

interface ImageLoaderProps {
  src: string;
  srcset?: string;
  sizes?: string;
  alt: string;
  className?: string;
  loading?: 'eager' | 'lazy';
  fetchpriority?: 'high' | 'low' | 'auto';
  width?: number;
  height?: number;
}

export default function ImageLoader({
  src,
  srcset,
  sizes,
  alt,
  className = '',
  loading = 'lazy',
  fetchpriority,
  width,
  height,
}: ImageLoaderProps) {
  const [isIntersecting, setIsIntersecting] = useState(loading === 'eager');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loading === 'eager') {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect();
        }
      },
      { rootMargin: '50px' },
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [loading]);

  // Extract size-related classes for the wrapper
  const sizeClasses = className
    .split(' ')
    .filter(
      (c) =>
        c.startsWith('w-') ||
        c.startsWith('h-') ||
        c === 'absolute' ||
        c === 'relative' ||
        c.startsWith('inset-'),
    )
    .join(' ');

  return (
    <div ref={ref} className={sizeClasses || 'inline-block'}>
      {isIntersecting && (
        <img
          src={src}
          srcSet={srcset}
          sizes={sizes}
          alt={alt}
          className={className}
          loading={loading}
          // @ts-expect-error fetchpriority is a valid attribute but not typed
          fetchpriority={fetchpriority}
          width={width}
          height={height}
        />
      )}
    </div>
  );
}
