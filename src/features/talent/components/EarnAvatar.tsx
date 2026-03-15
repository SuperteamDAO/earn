import React, { useState } from 'react';

import { cn } from '@/utils/cn';

interface EarnAvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  id: string | undefined;
  avatar?: string;
  className?: string;
  imgLoading?: 'lazy' | 'eager';
  imgDecoding?: 'async' | 'sync';
  imgFetchPriority?: 'high' | 'low' | 'auto';
}

const FALLBACK_PALETTE = [
  '#da4c65',
  '#5e25c2',
  '#d433ab',
  '#2e53af',
  '#ceea94',
  '#92a1c6',
  '#f0ab3d',
  '#c271b4',
] as const;

function hashValue(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index++) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function getFallbackAvatarStyle(seed: string) {
  const hash = hashValue(seed || 'avatar');
  const first = FALLBACK_PALETTE[hash % FALLBACK_PALETTE.length]!;
  const second =
    FALLBACK_PALETTE[(hash >> 3) % FALLBACK_PALETTE.length] || first;
  const third =
    FALLBACK_PALETTE[(hash >> 6) % FALLBACK_PALETTE.length] || second;
  const angle = hash % 360;
  const x = 15 + (hash % 70);
  const y = 15 + ((hash >> 4) % 70);

  return {
    backgroundImage: [
      `radial-gradient(circle at ${x}% ${y}%, ${third} 0%, transparent 38%)`,
      `linear-gradient(${angle}deg, ${first}, ${second})`,
    ].join(','),
  };
}

function getInitials(seed: string) {
  const tokens = seed
    .split(/[\s_-]+/)
    .map((token) => token.trim())
    .filter(Boolean);

  if (tokens.length === 0) {
    return '?';
  }

  return tokens
    .slice(0, 2)
    .map((token) => token[0]?.toUpperCase() || '')
    .join('');
}

export const EarnAvatar = ({
  id,
  avatar,
  className,
  onClick,
  imgLoading = 'lazy',
  imgDecoding = 'async',
  imgFetchPriority = 'auto',
  ...props
}: EarnAvatarProps) => {
  const [hasError, setHasError] = useState(false);
  const fallbackSeed = id || avatar || 'avatar';

  const handleImageError = () => {
    setHasError(true);
  };

  const commonClassName = 'grow rounded-full object-cover size-7';

  return (
    <div
      className={cn('shrink-0')}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      {...props}
    >
      {!hasError && avatar ? (
        <img
          src={avatar.replace('/upload/', '/upload/c_scale,f_auto,q_auto/')}
          alt={id || 'avatar'}
          className={cn(commonClassName, className)}
          onError={handleImageError}
          loading={imgLoading}
          decoding={imgDecoding}
          // fetchPriority is relatively new; cast for TS compatibility
          fetchPriority={imgFetchPriority as any}
        />
      ) : (
        <div
          className={cn(
            commonClassName,
            'flex items-center justify-center overflow-hidden text-white',
            className,
          )}
          style={getFallbackAvatarStyle(fallbackSeed)}
        >
          <span className="text-[0.65rem] font-semibold tracking-wide">
            {getInitials(fallbackSeed)}
          </span>
        </div>
      )}
    </div>
  );
};
