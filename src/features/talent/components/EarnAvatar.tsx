import Avatar from 'boring-avatars';
import React, { useState } from 'react';

import { cn } from '@/utils/cn';

interface EarnAvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  id: string | undefined;
  avatar?: string;
  className?: string;
}

export const EarnAvatar = ({
  id,
  avatar,
  className,
  onClick,
  ...props
}: EarnAvatarProps) => {
  const [hasError, setHasError] = useState(false);

  const handleImageError = () => {
    setHasError(true);
  };

  const commonClassName = 'flex-grow rounded-full object-cover h-8 w-8';

  return (
    <div
      className={cn('flex-shrink-0')}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      {...props}
    >
      {!hasError && avatar ? (
        <img
          src={avatar.replace('/upload/', '/upload/c_scale,f_auto/')}
          alt={id || 'avatar'}
          className={cn(commonClassName, className)}
          onError={handleImageError}
        />
      ) : (
        <div className={cn(commonClassName, className)}>
          <Avatar
            className="!h-full !w-full"
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
