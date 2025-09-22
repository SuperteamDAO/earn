import Avatar from 'boring-avatars';
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
        <div className={cn(commonClassName, className)}>
          <Avatar
            className="h-full! w-full!"
            size="100%"
            name={id}
            variant="marble"
            colors={[
              '#da4c65',
              '#5e25c2',
              '#d433ab',
              '#2e53af',
              '#ceea94',
              '#92a1c6',
              '#f0ab3d',
              '#c271b4',
            ]}
          />
        </div>
      )}
    </div>
  );
};
